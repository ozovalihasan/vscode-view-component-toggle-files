import { commands, Uri, window, Range, Selection, Position, workspace, FileType, TextEditor } from 'vscode';

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
            let snapName = ""
    
            snapName = setSnapName(editor)
            
            if (snapName === "" ) {
                return
            }

            let activeFileName = editor.document.fileName

            let changed_file_name = ""
            if ( isComponentFile(activeFileName) ){
                const folder = activeFileName.replace(/(.*components.*)\/component.*$/, `$1`)
                                                .replace(/\/__snapshots__.*$/, "")

                changed_file_name = folder + `/__snapshots__/${snapName}.snap`
                
            } else if ( isViewFile(activeFileName) ){
            
                changed_file_name = activeFileName.replace(/\/[^\/]*$/, `/__snapshots__/${snapName}.snap`)

            } else {
                window.setStatusBarMessage('The type of your active file couldn"t be defined', 1000);
                return
            }
            
            openDocument(changed_file_name)
        
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {

                changeToFileForComponents("app", ".rb")
                
            } else if ( isOriginalRailsFile(activeFileName) ) {
                
                let [controller, action] = findActionAndController()

                const workspaceFolder = getWorkspaceFolder()

                openDocument(workspaceFolder + "app/controllers/" + controller + "_controller.rb", () => moveCursorToAction(action))
            }
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-rspec-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {
                
                changeToFileForComponents("spec", "_spec.rb")  
                
            } else if ( isOriginalRailsFile(activeFileName) ) {

                changeToFileForRailsFiles("spec/views", ".html.erb_spec.rb")    
                
            } else {
                
                window.setStatusBarMessage("Your file is not suitable to toggle", 1000);

            }
        }
        
    });
    
    commands.registerCommand('vscode-view-component-toggle-files.change-to-html-erb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isComponentFile(activeFileName) ) {
                
                changeToFileForComponents("app/", ".html.erb")  
                
            } else if ( isOriginalRailsFile(activeFileName) ) {
                changeToFileForRailsFiles("app/views", ".html.erb")
            }
        }
    });

    commands.registerCommand('vscode-view-component-toggle-files.change-to-turbo-stream-erb-file', () => {
        const editor = window.activeTextEditor;

        if (editor) {
            let activeFileName = editor.document.fileName

            if ( isOriginalRailsFile(activeFileName) ) {
                changeToFileForRailsFiles("app/views", ".turbo_stream.erb")
            } else {
                window.setStatusBarMessage("There is no any file with 'turbo_stream' to open.", 1000);
            }
        }
    });
}

const openDocument = async (filePath: string, callback: Function | null = null) => {
    const editor = window.activeTextEditor;

    if (editor) {
        let activeFileName = editor.document.fileName

        if (activeFileName === filePath) {
            window.setStatusBarMessage("The requested page is already opened.", 1000);
        }
    }
    
    try {
        const document = await workspace.openTextDocument(filePath);
        await window.showTextDocument(document);
        if (callback) { callback() }
    } catch (e) {
        window.setStatusBarMessage("The file couldn't be opened.", 1000);
    }
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
    
    return false;
}

const getWorkspaceFolder = () => {
    const editor = window.activeTextEditor;

    if (editor) {
        let activeFileName = editor.document.fileName
        const workspaceFolder = activeFileName.match(/(.*\/)(app|spec)\/(views|controllers)/)?.slice(1)[0] || ""

        if (workspaceFolder === "") {
            window.setStatusBarMessage("There is no a workspace folder", 1000);
            return;
        }

        return workspaceFolder
    } else {
        window.setStatusBarMessage('There is no an editor to select.', 1000);    
    }
}

const changeToFileForRailsFiles = async (folderName: string, fileExtension: string) => {
    let [controller, action] = findActionAndController()
    
    let activeFileName = ""
    const editor = window.activeTextEditor;

    if (editor) {
        activeFileName = editor.document.fileName
    }
    
    if (controller !== "") {
        const workspaceFolder = getWorkspaceFolder()

        let fullPath = workspaceFolder + folderName + "/" + controller + "/" + action + fileExtension
        
        if (fileExtension.includes("html")) {
            const isFileExist = await checkFileExists(fullPath)
            
            if (!isFileExist) {
                fullPath = fullPath.replace("html", "turbo_stream")
            }
        }

        if (activeFileName.includes("turbo_stream") && isTestFile(fullPath)){
            fullPath = fullPath.replace("html", "turbo_stream")
        }

        const isFileExist = await checkFileExists(fullPath)
    
        if (isFileExist) {
            commands.executeCommand(
                'vscode.open',
                Uri.file(fullPath)
            );
        } else {
            window.setStatusBarMessage(`Your file(${fullPath}) doesn't exist.`, 1000);    
        }
    }
}

const findActionAndController = () => {
    const editor = window.activeTextEditor;

    if (editor) {
        let activeFileName = editor.document.fileName

        let folderOfController = activeFileName.replace(/(spec|app)\/(views|controllers)/, "app/views")
                                                    .replace(".turbo_stream.erb_spec.rb", "")
                                                    .replace(".html.erb_spec.rb", "")
                                                    .replace(".turbo_stream.erb", "")
                                                    .replace(".html.erb", "")
                                                    .replace("_controller.rb", "")
                                                    .replace(".rb", "")
                                                    .replace(".snap", "")

        let action = ""
        let controller = ""

        if ( isControllerFile(activeFileName) ) {
            const cursorPosition = editor.selection.active; 
            const fileTextToCursor = editor.document.getText(new Range(0, 0, cursorPosition.line, cursorPosition.character));
            
            [ action ] = fileTextToCursor.match(/def\s*\w+/g)?.slice(-1) || [ "" ];
            action = action.replace(/def\s*/, "");
            
            [ controller ] = folderOfController.match(/app\/views\/(.*)$/)?.slice(-1) || [ "" ];
            
        } else if ( isViewFile(activeFileName) ) {
            [controller, action] = folderOfController.match(/app\/views\/(.*)\/(\w+)$/)?.slice(-2) || [ "", "" ]
        } else if ( isViewSnapFile(activeFileName) ) {
            [controller, action] = folderOfController.match(/app\/views\/(.*)\/__snapshots__\/([^\/]+)/)?.slice(-2) || [ "", "" ]
        } else {
            window.setStatusBarMessage('There is no an action or a controller.', 1000);    
            return ["", ""]
        }
        
        return [controller, action]
    } else {
        window.setStatusBarMessage('There is no an editor to select.', 1000);    
        return ["", ""]
    }
    
}

const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
      await workspace.fs.stat(Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
}

const isComponentFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/components/));

const isHTMLViewFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/views\/.*\.html\.erb/));

const isTurboStreamViewFile = (fileName: string) => Boolean(fileName.match(/(app|spec)\/views\/.*\.turbo_stream\.erb/));

const isViewSnapFile = (fileName: string) => Boolean(fileName.match(/spec\/views\/.*\.snap/));

const isViewFile = (fileName: string) => (isHTMLViewFile(fileName) || isTurboStreamViewFile(fileName))

const isControllerFile = (fileName: string) => Boolean(fileName.match(/app\/controllers/));

const isTestFile = (fileName: string) => Boolean(fileName.match(/_spec.rb/));

const isOriginalRailsFile = (fileName: string) : Boolean => (isViewFile(fileName) || isControllerFile(fileName) || isViewSnapFile(fileName))

const setSnapName = (editor: TextEditor) => {
    
    let activeFileName = editor.document.fileName
    if (activeFileName.includes("__snapshots__")){
        return (activeFileName.match(/__snapshots__\/(.*)\.snap$/)?.slice(-1)[0] || "")
    }

    const partialSnapName = findExpectSnapshotMatch(editor);

    if (!partialSnapName){
        window.setStatusBarMessage("Please select an 'it' block with 'expect_snapshot_match'", 1000);
        return ""
    }

    if (isComponentFile(activeFileName)){
        
        return "component/" + partialSnapName
        
    } else if (isViewFile(activeFileName)){
        const [action, viewType] = activeFileName.match(/\/([^\/\.]*)\.(html|turbo_stream)\.erb/)?.slice(-2) || ["", ""]

        return action + "/" + viewType + "/" + partialSnapName
    } else {
        window.setStatusBarMessage('The type of your active file couldn"t be defined', 1000);
        return ""
    }
}

const isSnapFile = (str: String) => str.includes(".snap")

const findExpectSnapshotMatch = (editor: TextEditor): string => {
    let document = editor.document;
    const lines = document.getText().split('\n');
    
    const documentText = document.getText();
    if (!documentText.includes("expect_snapshot_match")) {
        return "";
    }
    
    const currentLine = editor.selection.active.line
    const currentLineIndex = currentLine - 1

    for (const line of lines.slice(currentLineIndex).concat(lines.slice(0, currentLineIndex).reverse())) {
        if (line.match(/it .* do/)){
            break;
        }

        if (line.match(/expect_snapshot_match/)){
            let currentLineMatch = line.match(/expect_snapshot_match\(\s*['|"](.*)['|"]\s*\)/);
            
            return (currentLineMatch && currentLineMatch[1]) || "default";
        }
    }
      
    return "";
}

const changeToFileForComponents = (folder_name: String, file_extension: String) => {
    
    const editor = window.activeTextEditor;

    if (editor) {

        let activeFileName = editor.document.fileName
   
        activeFileName = activeFileName.replace(/\/(app|spec)\//, `/${folder_name}/`)
                                        .replace(/\/__snapshots__/, "")
                                        .replace(/\/\w+\.snap/, "")
                                        .replace(/(\.html\.erb|\.rb|_spec\.rb)/, "")
                                        .replace(/\/$/, "")

        let changed_file_name = ""

        
        changed_file_name = activeFileName.replace(/\/component$/, `\/component${file_extension}`)

        commands.executeCommand(
            'vscode.open',
            Uri.file(changed_file_name)
        );
    }
}

const toSnakeCase = (str: string) => str.match(/[A-Z][a-z]+/g)?.map(s => s.toLowerCase()).join("_");
  
const componentToFileName = (componentName: string) => {
    return componentName.replace("::Component", "").split("::").map((part: string) => toSnakeCase(part)).join("/")
};

// this method is called when your extension is deactivated
export function deactivate() {}
