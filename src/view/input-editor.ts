import Component from "vue-class-component";
import * as Vue from "vue";
import * as Promise from "bluebird";
import * as _ from "lodash";

import { QueryCancelledError } from "../error";
import { parseInputContent } from "../parser";

type CompositeDisposable = any;
var { CompositeDisposable } = require("atom");

declare var atom: any;

@Component({
    template: `<atom-text-editor mini placeholder-text="placeholderText"></atom-text-editor>`
})
class InputEditor extends Vue {
    subscriptions: CompositeDisposable;
    placeholderText: string;

    // hack
    $el: any;

    data() {
        return {
            placeholderText: ""
        };
    }

    // lifecycle hook
    ready() {

        const confirmDisposable = atom.commands.add(this.$el, "core:confirm", () => {
            const expr = parseInputContent(this.$el.getModel().getText());
            this.$emit("confirm", expr);
            this.$dispatch("input-editor:confirm", expr);
        });
        const cancelDisposable = atom.commands.add(this.$el, "core:cancel", () => {
            this.$emit("cancel");
            this.$dispatch("input-editor:cancel");
        });

        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(confirmDisposable);
        this.subscriptions.add(cancelDisposable);
    }

    destroyed() {
        this.subscriptions.destroy();
    }


    // methods
    initialize(enableIM: boolean) {
        const textEditor = this.$el.getModel();

        // set grammar: agda to enable input method
        if (enableIM) {
            const agdaGrammar = atom.grammars.grammarForScopeName("source.agda");
            textEditor.setGrammar(agdaGrammar);
        } else {
            textEditor.setGrammar();
        }

        // reject old queries
        this.$dispatch("input-editor:cancel");

        this.focus();
        this.select();


        // set placeholder text
        textEditor.setPlaceholderText(this.placeholderText);
    }

    query(enableIM: boolean, placeholder: string): Promise<string> {
        this.placeholderText = placeholder;
        this.initialize(enableIM);
        return new Promise((resolve: (string) => void, reject) => {
            this.$once("confirm", (expr) => {
                resolve(expr);
            });
            this.$once("cancel", () => {
                reject(new QueryCancelledError("query cancelled"));
            });
        });
    }

    // focus the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => { this.$el.focus(); });
    }

    select() {
        this.$el.getModel().selectAll();
    }

    isFocused() {
        return _.includes(this.$el.classList, "is-focused");
    }

}

Vue.component("agda-input-editor", InputEditor);
export default InputEditor;
