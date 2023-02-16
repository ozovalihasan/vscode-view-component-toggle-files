import { commands, Uri, window } from 'vscode';

export function activate() {
    commands.registerCommand('vscode-view-component-toggle-files.quick-open-html-erb', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const current_line_text = editor.document.lineAt(cursorPosition.line).text
            let current_line_match = current_line_text.match(/render\s*(.*Component)/)
            let selected_text = ""

            if (current_line_match !== null) {
                selected_text = current_line_match[1].concat(".html.erb")
            } else {
                selected_text = editor.document.getText(editor.selection)
            }

            selected_text = selected_text.replace("::", "/");

            if (selected_text.toLowerCase().includes("\n")){
                selected_text = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selected_text
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.quick-open-ruby', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const current_line_text = editor.document.lineAt(cursorPosition.line).text
            let current_line_match = current_line_text.match(/render\s*(.*Component)/)
            let selected_text = ""

            if (current_line_match !== null) {
                selected_text = current_line_match[1].concat(".rb")
            } else {
                selected_text = editor.document.getText(editor.selection)
            }

            selected_text = selected_text.replace("::", "/");

            if (selected_text.toLowerCase().includes("\n")){
                selected_text = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selected_text
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rb-file', () => {
        changeToFile("app", ".rb")  
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rspec-file', () => {
        changeToFile("spec", "_spec.rb")  
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.change-to-html-erb-file', () => {
        changeToFile("app", ".html.erb")  
    });
}


const changeToFile = (folder_name: String, file_extension: String) => {
    
    const editor = window.activeTextEditor;

    if (editor) {
        let active_file_name = editor.document.fileName
        active_file_name = active_file_name.replace(/\/(app|spec)\//, `/${folder_name}/`)

        const changed_file_name = active_file_name.replace(/_component(\.html\.erb|\.rb|_spec\.rb)/, `_component${file_extension}`)
        
        commands.executeCommand(
            'vscode.open',
            Uri.file(changed_file_name)
        );
    }
}
// this method is called when your extension is deactivated
export function deactivate() {}
