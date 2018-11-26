import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactDOM from 'react-dom';
import * as path from 'path';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { EventEmitter } from 'events';
import ReduxThunk from 'redux-thunk'

import { Resource } from './util';
import { Core } from './core';
// import Panel from './view/component/Panel';
import Settings from './view/component/Settings';
import reducer from './view/reducers';
import { View as V } from './type';
import { EVENT } from './view/actions';
import * as Action from './view/actions';
import Tab from './view/tab';
import { TelePromise } from './util';
import { QueryCancelled } from './error';


import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

var { errorToHeader } = require('./Reason/View/JSON/JSON__Error.bs');
var { parseWhyInScope } = require('./Reason/View/Emacs/Emacs__Parser.bs');
var Panel = require('./Reason/View/Panel/Panel.bs').jsComponent;
var Reason = require('./Reason/Decoder.bs');


class EditorViewManager {
    main: Atom.TextEditor;
    general: Resource<Atom.TextEditor>;
    connection: Resource<Atom.TextEditor>;

    private focus: 'general' | 'connection' | 'main';

    private queryGeneralTP: TelePromise<string>;
    private queryConnectionTP: TelePromise<string>;

    constructor(main: Atom.TextEditor) {
        this.main = main;
        this.connection = new Resource;
        this.general = new Resource;
        this.focus = 'main';

        this.queryGeneralTP = new TelePromise;
        this.queryConnectionTP = new TelePromise;
    }

    focusMain() {
        atom.views.getView(this.main).focus();
        this.focus = 'main';
    }

    setFocus(focus: 'general' | 'connection' | 'main') {
        this.focus = focus;
    }

    generalIsFocused(): boolean { return this.focus === 'general' }
    connectionIsFocused(): boolean { return this.focus === 'connection' }

    // get the focused editor
    getFocusedEditor(): Promise<Atom.TextEditor> {
        if (this.general.isAvailable()) {
            return this.general.access().then(editor => {
                if (this.generalIsFocused())
                    return atom.views.getView(editor).getModel();
                else
                    return this.main;
            });
        }
        if (this.connection.isAvailable()) {
            return this.connection.access().then(editor => {
                if (this.connectionIsFocused())
                    return atom.views.getView(editor).getModel();
                else
                    return this.main;
            });
        } else {
            return Promise.resolve(this.main);
        }
    }

    //
    answerGeneral(payload :string) {
        this.queryGeneralTP.resolve(payload);
    }
    rejectGeneral() {
        this.queryGeneralTP.reject(new QueryCancelled);
    }

    answerConnection(payload :string) {
        this.queryConnectionTP.resolve(payload);
    }
    rejectConnection() {
        this.queryConnectionTP.reject(new QueryCancelled);
    }

    queryGeneral(): Promise<string> {
        return new Promise(this.queryGeneralTP.wire());
    }

    queryConnection(): Promise<string> {
        return new Promise(this.queryConnectionTP.wire());
    }
}

class TabManager {
    private panel: Tab;
    private settings: Tab;

    constructor(
        private core: Core,
        private store: Redux.Store<V.State>,
        mainEditor: Atom.TextEditor
    ) {
        // Tab for <Panel>
        this.panel = new Tab(mainEditor, 'panel');
        this.panel.onOpen((tab, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.core.view.renderPanel(tab.getElement());
        });

        // open <Panel> at the bottom when this tab got destroyed
        this.panel.onKill(tab => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.core.view.unmountPanel(V.MountingPosition.Pane);
            this.core.view.mountPanel(V.MountingPosition.Bottom);
        });

        // Tab for <Settings>
        this.settings = new Tab(mainEditor, 'settings', () => {
            const { name } = path.parse(mainEditor.getPath());
            return `[Settings] ${name}`
        });
        this.settings.onOpen((_, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render the view
            ReactDOM.render(
                <Provider store={this.store}>
                    <Settings
                        core={this.core}
                    />
                </Provider>,
                this.settings.getElement()
            );
        });

        this.settings.onKill(() => {
            this.store.dispatch(Action.VIEW.toggleSettings());
        });

    }

    open(tab: 'panel' | 'settings'): Promise<Tab> {
        switch(tab) {
            case 'panel':
                if (!this.panel.isActive()) {
                    return this.panel.open();
                } else {
                    return Promise.resolve(this.panel);
                }
            case 'settings':
                if (!this.settings.isActive()) {
                    return this.settings.open();
                } else {
                    return Promise.resolve(this.settings);
                }
        }
    }

    close(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                if (this.panel.isActive()) {
                    ReactDOM.unmountComponentAtNode(this.panel.getElement());
                    this.panel.close();
                }
                break;
            case 'settings':
                if (this.settings.isActive()) {
                    ReactDOM.unmountComponentAtNode(this.settings.getElement());
                    this.settings.close();
                }
                break;
        }
    }
    activate(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                this.panel.activate();
                break;
            case 'settings':
                this.settings.activate();
                break;
        }
    }
    destroyAll() {
        this.panel.destroy();
        this.settings.destroy();
    }
}


type Style = "plain-text" | "error" | "info" | "success" | "warning";

export default class View {
    public static EventContext = React.createContext(new EventEmitter);
    public static CoreContext = React.createContext(undefined);
     // = React.createContext(new EventEmitter);
    private emitter: EventEmitter;
    private subscriptions: Atom.CompositeDisposable;
    public store: Redux.Store<V.State>;
    public editors: EditorViewManager;
    private bottomPanel: Atom.Panel;
    public tabs: TabManager;

    private updateHeader: (state :{text: string; style: string}) => void;
    private updateIsPending: (state :{isPending: boolean}) => void;

    isPending(isPending: boolean) {
        if (this.updateIsPending)
            this.updateIsPending({isPending: isPending});
    }

    constructor(private core: Core) {
        this.store = createStore(
            reducer,
            applyMiddleware(ReduxThunk)
        );

        // global events
        this.emitter = new EventEmitter;
        this.emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.editor.jumpToGoal(index);
        });
        this.emitter.on(EVENT.JUMP_TO_RANGE, (range: Atom.Range, source: string) => {
            this.core.editor.jumpToRange(range, source);
        });
        this.emitter.on(EVENT.MOUSE_OVER, (range: Atom.Range, source: string) => {
            this.core.editor.mouseOver(range);
        });
        this.emitter.on(EVENT.MOUSE_OUT, (range: Atom.Range, source: string) => {
            this.core.editor.mouseOut();
        });

        // the event emitter garbage collector
        this.subscriptions = new CompositeDisposable;

        // views of editors
        this.editors = new EditorViewManager(core.editor.getTextEditor());

        // the tab manager
        this.tabs = new TabManager(this.core, this.store, core.editor.getTextEditor());

    }

    private state() {
        return this.store.getState().view;
    }


    public renderPanel(mountingPoint: HTMLElement) {
        ReactDOM.render(
            <View.EventContext.Provider value={this.emitter}>
                <View.CoreContext.Provider value={this.core}>
                <Panel
                    updateHeader={handle => {
                        this.updateHeader = handle;
                    }}
                    updateIsPending={handle => {
                        this.updateIsPending = handle;
                    }}
                    // core={this.core}
                    // headerText={state.header.text}
                    // style={toStyle(state.header.style)}
                    // hidden={state.inputMethod.activated || _.isEmpty(state.header.text)}
                    // isPending={state.protocol.pending}
                    // mountAt={state.view.mountAt.current === V.MountingPosition.Bottom ? 'bottom' : 'pane'}
                    onMountChange={(at) => {
                        this.core.view.toggleDocking();
                        if (at === "bottom") {
                            this.store.dispatch(Action.VIEW.mountAtBottom());
                        } else {
                            this.store.dispatch(Action.VIEW.mountAtPane());
                        }
                    }}
                    // settingsViewOn={state.view.settingsView}
                    onSettingsViewToggle={(isActivated) => {
                        this.store.dispatch(Action.VIEW.toggleSettings());
                        if (isActivated) {
                            this.core.view.tabs.open('settings');
                        } else {
                            this.core.view.tabs.close('settings');
                        }
                    }}
                />
                </View.CoreContext.Provider>
            </View.EventContext.Provider>,
            mountingPoint
        )
    }

    mountPanel(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            // Redux
            this.store.dispatch(Action.VIEW.mount());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    const element = document.createElement('article');
                    element.classList.add('agda-mode');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: element,
                        visible: true
                    });
                    // render
                    this.renderPanel(element);
                    break;
                case V.MountingPosition.Pane:
                    this.tabs.open('panel')
                    break;
                default:
                    console.error('no mounting position to transist to')
            }
        }
    }

    unmountPanel(mountAt: V.MountingPosition) {
        if (this.state().mounted) {
            // Redux
            this.store.dispatch(Action.VIEW.unmount());


            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    this.bottomPanel.destroy();
                    const itemElement = this.bottomPanel.getItem() as Element;
                    ReactDOM.unmountComponentAtNode(itemElement);
                    break;
                case V.MountingPosition.Pane:
                    this.tabs.close('panel');
                    break;
                default:
                    // do nothing
                    break;
            }

        }
    }

    activatePanel() {
        setTimeout(() => {
            this.store.dispatch(Action.VIEW.activate());
        })
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                // do nothing
                break;
            case V.MountingPosition.Pane:
                this.tabs.activate('panel');
                break;
            default:
                // do nothing
                break;
        }
    }

    deactivatePanel() {
        this.store.dispatch(Action.VIEW.deactivate());
    }

    // destructor
    destroy() {
        this.unmountPanel(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.tabs.destroyAll();
    }

    // for JSON
    setJSONError(rawJSON: object, rawString: string) {
        console.log(rawJSON)
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.updateHeader({
            text: errorToHeader(Reason.parseError(rawJSON)),
            style: 'error',
        });

        this.store.dispatch(Action.updateJSON({
            kind: 'Error',
            rawJSON: rawJSON,
            rawString: rawString
        }));
    }

    setJSONAllGoalsWarnings(rawJSON: object, rawString: string) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()


        this.updateHeader({
            text: 'All Goals, Warnings, and Errors',
            style: 'info'
        });

        this.store.dispatch(Action.updateJSON({
            kind: 'AllGoalsWarnings',
            rawJSON: rawJSON,
            rawString: rawString
        }));
    }

    // for Emacs
    setEmacsPanel(header, kind, payload, style: Style ="info") {

        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.updateHeader({
            text: header.substring(1, header.length - 1),
            style: 'info'
        });

        this.store.dispatch(Action.updateEmacs({
            kind: 'AllGoalsWarnings',
            header: header,
            body: payload
        }));
    }

    setEmacsGoalTypeContext(header: string = 'Judgements', goalTypeContext: string) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.updateHeader({
            text: header,
            style: 'info'
        });

        this.store.dispatch(Action.updateEmacs({
            kind: 'GoalTypeContext',
            header: header,
            body: goalTypeContext
        }));
    }

    setEmacsGoToDefinition(raw: string) {
        const result = parseWhyInScope(raw);
        if (result) {
            const [range, source] = result;
            this.core.editor.jumpToRange(range, source);
        }
    }

    setPlainText(header: string, body: string, style: Style ="plain-text") {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()


        this.updateHeader({
            text: header,
            style: style,
        });
        this.store.dispatch(Action.updateEmacs({
            kind: 'PlainText',
            header: header,
            body: body
        }));
    }

    query(header: string = '', _: string[] = [], placeholder: string = ''): Promise<string> {
        this.store.dispatch(Action.QUERY.setPlaceholder(placeholder));
        this.store.dispatch(Action.MODE.query());

        this.updateHeader({
            text: header,
            style: 'plain-text',
        });

        return this.editors.general.access()
            .then(editor => {
                if (!this.editors.generalIsFocused()) {
                    let element = atom.views.getView(editor);
                    element.focus();
                    element.getModel().selectAll();
                }
                return this.editors.queryGeneral();
            });
    }

    queryConnection(): Promise<string> {
        return this.tabs.open('settings').then(() => {
            this.store.dispatch(Action.VIEW.navigate({path: '/Connection'}));
            return this.editors.connection.access()
                .then(editor => {
                    if (!this.editors.connectionIsFocused()) {
                        let element = atom.views.getView(editor);
                        element.focus();
                        element.getModel().selectAll();
                    }
                    return this.editors.queryConnection();
                });
        });
    }

    toggleDocking(): Promise<{}> {
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                this.store.dispatch(Action.VIEW.mountAtPane());
                this.unmountPanel(V.MountingPosition.Bottom);
                this.mountPanel(V.MountingPosition.Pane);
                break;
            case V.MountingPosition.Pane:
                this.store.dispatch(Action.VIEW.mountAtBottom());
                this.unmountPanel(V.MountingPosition.Pane);
                this.mountPanel(V.MountingPosition.Bottom);
                break;
            default:
                // do nothing
                break;
        }
        return Promise.resolve({});
    }
}
