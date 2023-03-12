import { commands, Uri, window, Range, Selection, Position, workspace } from 'vscode';

const toSnakeCase = (str: string) => str.match(/[A-Z][a-z]+/g)?.map(s => s.toLowerCase()).join("_");
  
const componentToFileName = (componentName: string) => {
    return componentName.replace("::Component", "").split("::").map((part: string) => toSnakeCase(part)).join("/")
};

export function activate() {
    commands.registerCommand('vscode-view-component-toggle-files.quick-open-html-erb', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const currentLineText = editor.document.lineAt(cursorPosition.line).text
            let currentLineMatch = currentLineText.match(/render\s*(.*Component)/)
            let selectedText = ""

            if (currentLineMatch !== null) {
                selectedText = currentLineMatch[1].concat(".html.erb")
            } else {
                selectedText = editor.document.getText(editor.selection)
            }

            selectedText = selectedText.replace(/::/g, "/");

            if (selectedText.toLowerCase().includes("\n")){
                selectedText = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selectedText
            );
        } else {
            commands.executeCommand(
                'workbench.action.quickOpen'
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.quick-open-ruby', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            const cursorPosition = editor.selection.active
            const currentLineText = editor.document.lineAt(cursorPosition.line).text
            let currentLineMatch = currentLineText.match(/render\s*(.*Component)/)
            let selectedText = ""

            if (currentLineMatch !== null) {
                selectedText = currentLineMatch[1].concat(".rb")
            } else {
                selectedText = editor.document.getText(editor.selection)
            }

            selectedText = selectedText.replace("::", "/");

            if (selectedText.toLowerCase().includes("\n")){
                selectedText = ""
            }

            commands.executeCommand(
                'workbench.action.quickOpen',
                selectedText
            );
        }
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.search-files-including-component', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName
            activeFileName = activeFileName.replace(/.*\/(app|spec)\/components\//, "")
            activeFileName = activeFileName.replace(/\/component(\.html\.erb|\.rb|_spec\.rb)/, "")

            commands.executeCommand(
                'workbench.action.findInFiles',
                {   
                    query: activeFileName,
                    triggerSearch: true
                }
            );
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-snap-file', () => {
        const editor = window.activeTextEditor;
        if (editor) {
            let activeFileName = editor.document.fileName

            if (activeFileName.includes(".snap")){
                let originalFileNameMatch = activeFileName.match(/(.*)[_-]/)
                if (originalFileNameMatch){
                    activeFileName = activeFileName.replace(/\/__snapshots__/, "")
                    activeFileName = activeFileName.replace(/\/[^/]*$/, "_spec.rb")
                }

                commands.executeCommand(
                    'vscode.open',
                    Uri.file(activeFileName)
                );
                
            } else if ( activeFileName.match(/spec\/components\/.*_spec\.rb/) ) {
                const cursorPosition = editor.selection.active
                const currentLineText = editor.document.lineAt(cursorPosition.line).text
                if (!currentLineText.match("match_custom_snapshot")) {
                    window.setStatusBarMessage('Please select a line containing "match_custom_snapshot"', 1000);
                    return
                }
                let currentLineMatch = currentLineText.match(/match_custom_snapshot\(\s*['|"](.*)['|"]\s*\)/)
                let snapshotName = (currentLineMatch && currentLineMatch[1]) || "default"
                
                let activeFileName = editor.document.fileName
                let activeFileNameMatch = activeFileName.match(/(.*\/)([^\/]*)_spec.rb$/)

                let folderOfSnapshot = ""
                if (activeFileNameMatch){
                    folderOfSnapshot = activeFileNameMatch[1] + "__snapshots__/" + activeFileNameMatch[2] + "/"
                }
                
                let selectedSnapshot = ""
                if (snapshotName !== "" && folderOfSnapshot !== "" ) {
                    selectedSnapshot = folderOfSnapshot.concat(snapshotName).concat(".snap")
                } else {
                    window.setStatusBarMessage("A suitable snapshot file couldn't be found", 1000);
                    return
                }

                commands.executeCommand(
                    'vscode.open',
                    Uri.file(selectedSnapshot)
                );
            }
            
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {

                changeToFileForComponents("app", ".rb")
                
            } else if ( isViewFile(activeFileName) ) {
                let [_, controllersFolder, controllerPath, action] = activeFileName.match(/(.*app)\/views\/(.*)\/(.*)\.(turbo_stream|html)\.erb/) || []
                window.setStatusBarMessage(action, 1000);    
                if (!controllerPath) {
                    window.setStatusBarMessage('There is no controller.', 1000);    
                    return
                }

                controllerPath = controllersFolder + "/controllers/" + controllerPath + "_controller.rb"

                openDocument(controllerPath, () => moveCursorToAction(action))
            }
        }
    });

    async function openDocument(filePath: string, callback: Function) {
        const document = await workspace.openTextDocument(filePath);
        await window.showTextDocument(document);
        callback()
    }

    const  moveCursorToAction = (action: string) => {
        const editor = window.activeTextEditor;
        if (!editor) {
          window.showErrorMessage('No active text editor');
          return;
        }

        if (checkingAction(action)) { return }

        const actionDefinition = `def ${action}`
        
        const document = editor.document;
        const wordPosition = document.positionAt(document.getText().indexOf(actionDefinition));
        const newPosition = new Position(wordPosition.line, wordPosition.character + actionDefinition.length);
        
        editor.edit(editBuilder => {
          editBuilder.insert(newPosition, '');
        }).then(() => {
          editor.selection = new Selection(newPosition, newPosition);
        });
    }

    const checkingAction = (action: string) => {
        const editor = window.activeTextEditor;
        
        if (!editor) {
            window.showErrorMessage('No active text editor');
            return;
        }

        const cursorPosition = editor.selection.active; 
        const fileTextToCursor = editor.document.getText(new Range(0, 0, cursorPosition.line, cursorPosition.character));

        if (fileTextToCursor.match(new RegExp("(\\s\*)def\\s+" + action + "\\s*\\n(.*\\n)*" + "\\1end"))) { return false}
        if (fileTextToCursor.match(new RegExp("(\\s\*)def\\s+" + action))) { return true}
        
        return false
    
    }

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rspec-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {
                
                changeToFileForComponents("spec", "_spec.rb")  
                
            } else if ( isViewFile(activeFileName) ) {

                
                let original_file_name = activeFileName.replace(/(spec|app)\/views/, "spec/views")
                                                        .replace("_spec.rb", "")
                                                        .concat("_spec.rb", "")
                
                commands.executeCommand(
                    'vscode.open',
                    Uri.file(original_file_name)
                );
            }
        }
        
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.change-to-html-erb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {
                
                changeToFileForComponents("app", ".html.erb")  
                
            } else if ( isViewFile(activeFileName) ) {
                let original_file_name = activeFileName.replace(/(spec|app)\/views/, "app/views")
                                                        .replace("_spec.rb", "")
                                                        .replace(".html.erb", "")
                                                        .replace(".turbo_stream.erb", "")
                
                commands.executeCommand(
                    'vscode.open',
                    Uri.file(original_file_name + ".html.erb")
                );
                
            } else if ( isControllerFile(activeFileName) ) {
                let original_file_name = activeFileName.replace(/app\/controllers/, "app/views").replace("_controller.rb", "")

                const cursorPosition = editor.selection.active; 
                const fileTextToCursor = editor.document.getText(new Range(0, 0, cursorPosition.line, cursorPosition.character));
                
                let action = fileTextToCursor.match(/def \w+/g)?.slice(-1)[0]
   
                commands.executeCommand(
                    'vscode.open',
                    Uri.file(original_file_name + "/" + action + ".html.erb")
                );
            }
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-turbo-stream-erb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {
                
                window.setStatusBarMessage("The file is a component file. It doesn't have a turbo_stream file", 1000);
                
            } else if ( isViewFile(activeFileName) ) {
                let original_file_name = activeFileName.replace(/(spec|app)\/views/, "app/views")
                                                        .replace("_spec.rb", "")
                                                        .replace(".html.erb", "")
                                                        .replace(".turbo_stream.erb", "")
                
                commands.executeCommand(
                    'vscode.open',
                    Uri.file(original_file_name + ".turbo_stream.erb")
                );
                
            } else if ( isControllerFile(activeFileName) ) {
                let original_file_name = activeFileName.replace(/app\/controllers/, "app/views").replace("_controller.rb", "")

                const cursorPosition = editor.selection.active; 
                const fileTextToCursor = editor.document.getText(new Range(0, 0, cursorPosition.line, cursorPosition.character));
                
                let action = fileTextToCursor.match(/def \w+/g)?.slice(-1)[0].replace("def ", "")
   
                commands.executeCommand(
                    'vscode.open',
                    Uri.file(original_file_name + "/" + action + ".turbo_stream.erb")
                );
            }
        }
    });
}



const isComponentFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/components/));

const isHTMLViewFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/views\/.*\.html\.erb/));

const isTurboStreamViewFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/views\/.*\.turbo_stream\.erb/));

const isViewFile = (fileName: string) => (isHTMLViewFile(fileName) || isTurboStreamViewFile(fileName))

const isControllerFile = (fileName: string) => Boolean(fileName.match(/app\/controllers/));

const changeToFileForComponents = (folder_name: String, file_extension: String) => {
    
    const editor = window.activeTextEditor;

    if (editor) {
        let activeFileName = editor.document.fileName
        activeFileName = activeFileName.replace(/\/(app|spec)\//, `/${folder_name}/`)

        const changed_file_name = activeFileName.replace(/\/component(\.html\.erb|\.rb|_spec\.rb)/, `\/component${file_extension}`)
        
        commands.executeCommand(
            'vscode.open',
            Uri.file(changed_file_name)
        );
    }
}
// this method is called when your extension is deactivated
export function deactivate() {}
