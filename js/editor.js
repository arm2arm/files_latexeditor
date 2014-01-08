function setEditorSize() {
	// Sets the size of the text editor window.
	fillWindow($('#editor'));
}

function getFileExtension(file) {
	var parts = file.split('.');
	return parts[parts.length - 1];
}

function setSyntaxMode(ext) {
	// Loads the syntax mode files and tells the editor
	var filetype = new Array();
	// add file extensions like this: filetype["extension"] = "filetype":
	filetype["h"] = "c_cpp";
	filetype["c"] = "c_cpp";
	filetype["clj"] = "clojure";
	filetype["coffee"] = "coffee"; // coffescript can be compiled to javascript
	filetype["coldfusion"] = "cfc";
	filetype["cpp"] = "c_cpp";
	filetype["cs"] = "csharp";
	filetype["css"] = "css";
	filetype["groovy"] = "groovy";
	filetype["haxe"] = "hx";
	filetype["htm"] = "html";
	filetype["html"] = "html";
	filetype["java"] = "java";
	filetype["js"] = "javascript";
	filetype["jsm"] = "javascript";
	filetype["json"] = "json";
	filetype["latex"] = "latex";
	filetype["less"] = "less";
	filetype["ly"] = "latex";
	filetype["ily"] = "latex";
	filetype["lua"] = "lua";
	filetype["markdown"] = "markdown";
	filetype["md"] = "markdown";
	filetype["mdown"] = "markdown";
	filetype["mdwn"] = "markdown";
	filetype["mkd"] = "markdown";
	filetype["ml"] = "ocaml";
	filetype["mli"] = "ocaml";
	filetype["pl"] = "perl";
	filetype["php"] = "php";
	filetype["powershell"] = "ps1";
	filetype["py"] = "python";
	filetype["rb"] = "ruby";
	filetype["scad"] = "scad"; // seems to be something like 3d model files printed with e.g. reprap
	filetype["scala"] = "scala";
	filetype["scss"] = "scss"; // "sassy css"
	filetype["sh"] = "sh";
	filetype["sql"] = "sql";
	filetype["svg"] = "svg";
	filetype["tex"] = "latex"; 
	filetype["textile"] = "textile"; // related to markdown
	filetype["xml"] = "xml";

	if (filetype[ext] != null) {
		// Then it must be in the array, so load the custom syntax mode
		// Set the syntax mode
	        OC.addScript('files_latexeditor', 'vendor/ace/src-noconflict/mode-' + filetype[ext], function () {
                        var SyntaxMode = ace.require("ace/mode/" + filetype[ext]).Mode;
                        window.aceEditor.getSession().setMode(new SyntaxMode());
                });
	}
}

function isLatex(filename){
    //return $('#isPublic').val() && (getFileExtension(filename)=='tex'||getFileExtension(filename)=='latex');
    return getFileExtension(filename)=='tex'||getFileExtension(filename)=='latex';
}

function showControls(dir, filename, writeable) {
	// Loads the control bar at the top.
	OC.Breadcrumb.show(dir, filename, '#');
	// Load the new toolbar.
	var editorbarhtml = '<div id="editorcontrols" style="display: none;">';
	if (writeable) {
		editorbarhtml += '<button id="editor_save">' + t('files_latexeditor', 'Save') + '</button><div class="separator"></div>';
		if(isLatex(filename))
			editorbarhtml += '<button id="editor_compile">'+t('files_latexeditor','LaTex')+'</button><div class="separator"></div>';
	}
	editorbarhtml += '<label for="editorseachval">' + t('files_latexeditor', 'Search:');
	editorbarhtml += '</label><input type="text" name="editorsearchval" id="editorsearchval">';
	editorbarhtml += '<div class="separator"></div><button id="editor_close">';
	editorbarhtml += t('files_latexeditor', 'Close') + '</button></div>';

	$('#controls').append(editorbarhtml);
	$('#editorcontrols').show();
}

function bindControlEvents() {
	$('#content').on('click', '#editor_save', doFileSave);
	$('#content').on('click', '#editor_close', hideFileEditor);
	$('#content').on('click', '#editor_compile', doCompile);
	$('#content').on('keyup', '#editorsearchval', doSearch);
	$('#content').on('click', '#clearsearchbtn', resetSearch);
	$('#content').on('click', '#nextsearchbtn', nextSearchResult);
}

// returns true or false if the editor is in view or not
function editorIsShown() {
	return is_editor_shown;
}

//resets the search
function resetSearch() {
	$('#editorsearchval').val('');
	$('#nextsearchbtn').remove();
	$('#clearsearchbtn').remove();
	window.aceEditor.gotoLine(0);
}

// moves the cursor to the next search resukt
function nextSearchResult() {
	window.aceEditor.findNext();
}
// Performs the initial search
function doSearch() {
	// check if search box empty?
	if ($('#editorsearchval').val() == '') {
		// Hide clear button
		window.aceEditor.gotoLine(0);
		$('#nextsearchbtn').remove();
		$('#clearsearchbtn').remove();
	} else {
		// New search
		// Reset cursor
		window.aceEditor.gotoLine(0);
		// Do search
		window.aceEditor.find($('#editorsearchval').val(), {
			backwards: false,
			wrap: false,
			caseSensitive: false,
			wholeWord: false,
			regExp: false
		});
		// Show next and clear buttons
		// check if already there
		if ($('#nextsearchbtn').length == 0) {
			var nextbtnhtml = '<button id="nextsearchbtn">' + t('files_latexeditor', 'Next') + '</button>';
			var clearbtnhtml = '<button id="clearsearchbtn">' + t('files_latexeditor', 'Clear') + '</button>';
			$('#editorsearchval').after(nextbtnhtml).after(clearbtnhtml);
		}
	}
}

// Tries to save the file.
function doFileSave() {
	if (editorIsShown()) {
		// Changed contents?
		if ($('#editor').attr('data-edited') == 'true') {
			// Get file path
			var path = $('#editor').attr('data-dir') + '/' + $('#editor').attr('data-filename');
			// Get original mtime
			var mtime = $('#editor').attr('data-mtime');
			// Show saving spinner
			$("#editor_save").die('click', doFileSave);
			$('#save_result').remove();
			$('#editor_save').text(t('files_latexeditor', 'Saving...'));
			// Get the data
			var filecontents = window.aceEditor.getSession().getValue();
			// Send the data
			$.post(OC.filePath('files_latexeditor', 'ajax', 'savefile.php'), { filecontents: filecontents, path: path, mtime: mtime }, function (jsondata) {
				if (jsondata.status != 'success') {
					// Save failed
					$('#editor_save').text(t('files_latexeditor', 'Save'));
					$('#notification').html(t('files_latexeditor', 'Failed to save file'));
					$('#notification').fadeIn();
					$('#editor_save').live('click', doFileSave);
				} else {
					// Save OK
					// Update mtime
					$('#editor').attr('data-mtime', jsondata.data.mtime);
					$('#editor_save').text(t('files_latexeditor', 'Save'));
					$("#editor_save").live('click', doFileSave);
					// Update titles
					$('#editor').attr('data-edited', 'false');
					$('.crumb.last').text($('#editor').attr('data-filename'));
					document.title = $('#editor').attr('data-filename') + ' - ownCloud';
				}
			}, 'json');
		}
	}
	giveEditorFocus();
};

// Gives the editor focus
function giveEditorFocus() {
	window.aceEditor.focus();
};

// Loads the file editor. Accepts three parameters: dir, filename and mime type
function showFileEditor(dir, filename) {
	// Check if unsupported file format
	if(FileActions.getCurrentMimeType() == 'text/rtf') {
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
			$('#content').append('<div id="editor"></div>');
			var data = $.getJSON(
				OC.filePath('files_latexeditor', 'ajax', 'loadfile.php'),
				{file: filename, dir: dir},
				function (result) {
					if (result.status == 'success') {
						// Save mtime
						$('#editor').attr('data-mtime', result.data.mtime);
						// Initialise the editor
						$('.actions,#file_action_panel,#content table').hide();
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
						setEditorSize();
						if (result.data.mime && result.data.mime === 'text/html') {
							setSyntaxMode('html');
						} else {
							setSyntaxMode(getFileExtension(filename));
						}
						OC.addScript('files_latexeditor', 'vendor/ace/src-noconflict/theme-clouds', function () {
							window.aceEditor.setTheme("ace/theme/clouds");
						});
						window.aceEditor.getSession().on('change', function () {
							if ($('#editor').attr('data-edited') != 'true') {
								$('#editor').attr('data-edited', 'true');
								$('.crumb.last').text($('.crumb.last').text() + ' *');
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

// Fades out the editor.
function hideFileEditor() {
	OC.Breadcrumb.show($('#dir').val());
	if ($('#editor').attr('data-edited') == 'true') {
		// Hide, not remove
		$('#editorcontrols,#editor').hide();
		// Fade out editor
		// Reset document title
		document.title = $('body').attr('old_title');
		$('.actions,#file_access_panel').show();
		$('#content table').show();
		OC.Notification.show(t('files_latexeditor', 'There were unsaved changes, click here to go back'));
		$('#notification').data('reopeneditor', true);
		is_editor_shown = false;
	} else {
		// Fade out editor
		$('#editor, #editorcontrols').remove();
		// Reset document title
		document.title = $('body').attr('old_title');
		$('.actions,#file_access_panel').show();
		$('#content table').show();
		is_editor_shown = false;
	}
}

// Reopens the last document
function reopenEditor() {
	$('.actions,#file_action_panel').hide();
	$('#content table').hide();
	$('#controls .last').not('#breadcrumb_file').removeClass('last');
	$('#editor').show();
	$('#editorcontrols').show();
	OC.Breadcrumb.show($('#editor').attr('data-dir'), $('#editor').attr('data-filename') + ' *', '#');
	document.title = $('#editor').attr('data-filename') + ' * - ownCloud';
	is_editor_shown = true;
	giveEditorFocus();
}

// resizes the editor window
$(window).resize(function () {
	setEditorSize();
});
var is_editor_shown = false;
$(document).ready(function () {
	if ($('#isPublic').val()){
		// disable editor in public mode (not supported yet)
		return;
	}
	if (typeof FileActions !== 'undefined') {
		FileActions.register('text', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('text', 'Edit');
		FileActions.register('application/xml', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('application/xml', 'Edit');
		FileActions.register('application/x-empty', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('application/x-empty', 'Edit');
		FileActions.register('inode/x-empty', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('inode/x-empty', 'Edit');
		FileActions.register('application/x-php', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('application/x-php', 'Edit');
		FileActions.register('application/javascript', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('application/javascript', 'Edit');
		FileActions.register('application/x-pearl', 'Edit', OC.PERMISSION_READ, '', function (filename) {
			showFileEditor($('#dir').val(), filename);
		});
		FileActions.setDefault('application/x-pearl', 'Edit');

	}
	OC.search.customResults.Text = function (row, item) {
		var text = item.link.substr(item.link.indexOf('download') + 8);
		var a = row.find('td.result a');
		a.data('file', text);
		a.attr('href', '#');
		a.click(function () {
			text = decodeURIComponent(text);
			var pos = text.lastIndexOf('/');
			var file = text.substr(pos + 1);
			var dir = text.substr(0, pos);
			showFileEditor(dir, file);
		});
	};
	// Binds the file save and close editor events, and gotoline button
	bindControlEvents();
	$('#editor').remove();
	$('#notification').click(function () {
		if ($('#notification').data('reopeneditor')) {
			reopenEditor();
			OC.Notification.hide();
		}
	});
});


function AjaxCompile(ajaxpath, path,filename,pdflatex){
    var jqxhr = $.ajax({
        type: 'POST',
        url: ajaxpath,
        data: {
            path:path,
            filename:filename,
            compiler:pdflatex
        },
        dataType: 'json',
        global: false,
        async:false,
        beforeSend: function (  ) {
          doFileSave();
        },
        success: function(jsondata) {
            if(jsondata.status!='success'){
                $(":button:contains('ViewPdf')").button('disable');

            } else {
                // Compile OK
                // Update titles                                                    
                $(":button:contains('ViewPdf')").button('enable');
            }
            return jsondata;
        }
    }).responseText;

    jqxhr=jQuery.parseJSON(jqxhr);

    return jqxhr;
}


function DestroIfExist(idname)
{
    if(document.getElementById(idname)) {
        $("#"+idname).remove();
    }
}

function compileFile(filename,path){

    //var message="Dir: "+path+" \nFilename: "+filename;


    var ajaxpath=OC.filePath('files_latexeditor','ajax','compile.php');
    var pdffile="";
    var data="";

    DestroIfExist("dialogcompile");
    var compileDlg=$('<div id="dialogcompile"  title="'+'Compiling:'+ path+filename +'"><div id="latexresult" class="" style="width:98%;height:98%;"> </div></div>').dialog({
        modal: false,
        open: function(e, ui) {
            $(e.target).parent().find('span').filter(function(){
                return $(this).text() === 'dummy';
            }).parent().replaceWith('<select id="compiler" name="compiler"><option value="latex">LaTeX</option><option value="pdflatex">PDFLaTeX</option><option value="xelatex">XeLaTeX</option></select>');
        },
        buttons: {
            'dummy': function(e){
            },
            Compile: function(){

                $('#latexresult').html("Compiling...");
                json=AjaxCompile(ajaxpath,path, filename,$('#compiler').val());
                if(json){
                    //alert(json.data.output);
                    $('#latexresult').html("");
                    if(json.data.message){
                        $('#latexresult').html(json.data.message);
                        // $('#latexresult').addClass('ui-state-error');
                        $('#latexresult').css({
                            color:"red"
                        });
                    }
                    else{
                        $('#latexresult').removeClass('ui-state-error');
                        $('#latexresult').css({
                            color:"darkblue"
                        });

                    }

                    $('#latexresult').append(json.data.output);

                }

            },
	    ViewPdf: function(){
                //console.log('width:'+$(this).width()*0.9+';height:'+$(this).height()*0.8);                
                var pdfviewerpath="/index.php/apps/files_pdfviewer/viewer.php?dir="+json.data.path+"&file="+json.data.pdffile;

                frame='<iframe id="latexresultpdf"  style="width:100%;height:100%;display:block;"></iframe>';
                $('#latexresult').html(frame).promise().done(function(){

                    $('#latexresultpdf').attr('src',pdfviewerpath);
                    //check if all paths are ok
			//alert("Done:"+pdfviewerpath);
                });

            },
            Close: function() {
                $( this ).dialog( "close" );
		//window.location.href('/?app=files&dir='+path);
		window.location.reload();
            }
        }
    })


    //console.log($('#editor').position());
    //console.log($('#editor').offset());
    x=$('#editor').position().left+$('#editor').width()*0.45;
    y=$('#editor').position().top+10;
    compileDlg.dialog({
        width:$('#editor').width()*0.5,
        height:$('#editor').height()*0.85,
        position: [x, y]
    });


    $(":button:contains('ViewPdf')").button('disable');
    //reopenEditor();
}


//Tries to compile The file
function doCompile(){
    if(editorIsShown()){

        var filename = $('#editor').attr('data-filename');
        var dir=$('#editor').attr('data-dir')+'/';

        compileFile(filename, dir);
    }
}

