"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
const connector_1 = require("../../../connector");
class NewConnection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            method: 'local',
            localURL: '',
            localMessage: ''
        };
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
        this.handleLocalURLChange = this.handleLocalURLChange.bind(this);
    }
    selectLocal() {
        this.setState({
            method: 'local'
        });
    }
    selectRemote() {
        this.setState({
            method: 'remote'
        });
    }
    handleLocalURLChange(event) {
        this.setState({
            localURL: event.target.value
        });
    }
    render() {
        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';
        const classList = classNames({
            hidden: !this.props.show
        });
        return (React.createElement("section", { className: classList },
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plus" }, "New Connection")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon icon-x inline-block-tight", onClick: this.props.onCancel }, "cancel"))),
            React.createElement("section", null,
                React.createElement("form", { id: "new-connection-dashboard" },
                    React.createElement("input", { id: "local-connection", className: 'input-radio', type: 'radio', name: 'connection-method', defaultChecked: true, onChange: this.selectLocal }),
                    React.createElement("label", { htmlFor: "local-connection" },
                        React.createElement("h3", null,
                            React.createElement("span", { className: "icon icon-home" }, "Local")),
                        React.createElement("p", null, "Establish connection to the Agda executable on your machine. The good old default."),
                        React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda', disabled: disableLocal, value: this.state.localURL, onChange: this.handleLocalURLChange }),
                        React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", disabled: disableLocal, onClick: () => {
                                connector_1.validate(connector_1.mkConnection(this.state.localURL))
                                    .then((conn) => {
                                    console.log(conn);
                                    this.setState({
                                        localMessage: ''
                                    });
                                })
                                    .catch((error) => {
                                    this.setState({
                                        localMessage: error.message
                                    });
                                });
                                // console.log(this.props.core.connector.)
                            } }, "connect"),
                        React.createElement("div", { className: 'text-warning' }, this.state.localMessage)),
                    React.createElement("hr", null),
                    React.createElement("input", { id: "remote-connection", className: 'input-radio', type: 'radio', name: 'connection-method', onChange: this.selectRemote, disabled: true }),
                    React.createElement("label", { htmlFor: "remote-connection" },
                        React.createElement("h3", null,
                            React.createElement("span", { className: "icon icon-globe" }, "Remote")),
                        React.createElement("p", null, "Establish connection to some remote Agda process on this planet via TCP/IP"),
                        React.createElement("div", { id: "remote-connection-inputs" },
                            React.createElement("input", { id: "remote-connection-url", className: 'input-text native-key-bindings', type: 'text', placeholder: 'URL', disabled: disableRemote }),
                            React.createElement("input", { id: "remote-connection-port", className: 'input-text native-key-bindings', type: 'text', placeholder: 'port', defaultValue: "8192", disabled: disableRemote })),
                        React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", disabled: disableRemote }, "connect"))))));
    }
}
exports.default = NewConnection;
//# sourceMappingURL=NewConnection.js.map