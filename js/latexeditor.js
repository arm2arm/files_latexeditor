// Loads the file editor. Accepts two parameters, dir and filename.
function showLatexCompiler(dir, filename) {
	// Check if unsupported file format
	if(FileActions.getCurrentMimeType() === 'text/rtf') {
		// Download the file instead.
		window.location = OC.filePath('files', 'ajax', 'download.php') + '?files=' + encodeURIComponent(filename) + '&dir=' + encodeURIComponent($('#dir').val());
	} else {
		if (!editorIsShown()) {
			is_editor_shown = true;
			// Delete any old editors
			if ($('#notification').data('reopeneditor')) {
				OC.Notification.hide();
			}
			$('#editor').remove();
			// Loads the file editor and display it.
			$('#content').append('<div id="editor_container"><div id="editor"></div></div>');
			var data = $.getJSON(
				OC.filePath('files_latexeditor', 'ajax', 'loadfile.php'),
				{file: filename, dir: dir},
				function (result) {
					if (result.status === 'success') {
						// Save mtime
						$('#editor').attr('data-mtime', result.data.mtime);
						// Initialise the editor
						if (window.FileList){
							FileList.setViewerMode(true);
							enableEditorUnsavedWarning(true);
							$('#fileList').on('changeDirectory.texteditor', textEditorOnChangeDirectory);
						}
						// Show the control bar
						showControls(dir, filename, result.data.writeable);
						// Update document title
						$('body').attr('old_title', document.title);
						document.title = filename + ' - ownCloud';
						$('#editor').text(result.data.filecontents);
						$('#editor').attr('data-dir', dir);
						$('#editor').attr('data-filename', filename);
						$('#editor').attr('data-edited', 'false');
						window.aceEditor = ace.edit("editor");
						aceEditor.setShowPrintMargin(false);
						aceEditor.getSession().setUseWrapMode(true);
						if ( ! result.data.writeable ) {
							aceEditor.setReadOnly(true);
						}
						if (result.data.mime && result.data.mime === 'text/html') {
							setSyntaxMode('html');
						} else {
							setSyntaxMode(getFileExtension(filename));
						}
						OC.addScript('files_texteditor', 'vendor/ace/src-noconflict/theme-clouds', function () {
							window.aceEditor.setTheme("ace/theme/clouds");
						});
						window.aceEditor.getSession().on('change', function () {
							if ($('#editor').attr('data-edited') != 'true') {
								$('#editor').attr('data-edited', 'true');
								$('.crumb.last a').text($('.crumb.last a').text() + ' *');
								document.title = $('#editor').attr('data-filename') + ' * - ownCloud';
							}
						});
						// Add the ctrl+s event
						window.aceEditor.commands.addCommand({
							name: "save",
							bindKey: {
								win: "Ctrl-S",
								mac: "Command-S",
								sender: "editor"
							},
							exec: function () {
								doFileSave();
							}
						});
						giveEditorFocus();
					} else {
						// Failed to get the file.
						OC.dialogs.alert(result.data.message, t('files_latexeditor', 'An error occurred!'));
					}
					// End success
				}
				// End ajax
			);
			return data;
		}
	}
}

$(document).ready(function(){
        // doesn't work in IE or public link mode
        if(!$.browser.msie && !$('#isPublic').val()){
                if ($('#filesApp').val() && typeof FileActions!=='undefined'){
                        FileActions.register('application/x-tex','Edit', OC.PERMISSION_READ, '',function(filename){
                                showLatexCompiler($('#dir').val(),filename);
                        });
                        FileActions.setDefault('application/x-tex','Edit');
                }
        }
});
