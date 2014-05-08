/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




function isLatex(filename){
   
    return getFileExtension(filename)=='tex'||getFileExtension(filename)=='latex';
}


function AjaxCompile(ajaxpath, path,filename,pdflatex){
    var jqxhr = $.ajax({
        type: 'POST',
        url: ajaxpath,
        data: {
            path:path,
            filename:filename,
            pdflatex:pdflatex?1:0
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

    var is_compiled = false;
    var ajaxpath=OC.filePath('files_latexeditor','ajax','compile.php');
    var pdffile="";
    var data="";

    DestroIfExist("dialogcompile");
    var compileDlg=$('<div id="dialogcompile"  title="'+'Compiling:'+ path+filename +'"><div id="latexresult" class="" style="width:98%;height:98%;"> </div></div>').dialog({
        modal: false,
        open: function(e, ui) {
            $(e.target).parent().find('span').filter(function(){
                return $(this).text() === 'dummy';
            }).parent().replaceWith('<input id="pdflatex" value="pdflatex" name="pdflatex" type=\'checkbox\'>use pdflatex </input>');
        },
        buttons: {
            'dummy': function(e){
            },
            Compile: function(){

    		is_compiled = true;
                $('#latexresult').html("Compiling...");
                json=AjaxCompile(ajaxpath,path, filename,$('#pdflatex').is(':checked'));
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
                //var pdfviewerpath="http://www.google.com";

                frame='<iframe id="latexresultpdf"  style="width:100%;height:100%;display:block;"></iframe>';
                $('#latexresult').html(frame).promise().done(function(){

                    $('#latexresultpdf').attr('src',pdfviewerpath);
                    //alert("Done");
                });

            },
            Close: function() {
                $( this ).dialog( "close" );
		if ( is_compiled )
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

function showLatexControls(dir, filename, writeable) {
        // Loads the control bar at the top.
        OC.Breadcrumb.show(dir, filename, '#');
        // Load the new toolbar.
        var editorbarhtml = '<div id="editorcontrols" style="display: none;">';
        if (writeable) {
                editorbarhtml += '<button id="editor_save">' + t('files_texteditor', 'Save') + '</button>';
		editorbarhtml += '<button id="editor_compile">'+'LaTeX'+'</button><div class="separator"></div>';
        }
        editorbarhtml += '<label for="editorseachval">' + t('files_texteditor', 'Search');
        editorbarhtml += '</label><input type="text" name="editorsearchval" id="editorsearchval">';
        editorbarhtml += '<button id="editor_close">';
        editorbarhtml += t('files_texteditor', 'Close') + '</button></div>';

        $('#controls').append(editorbarhtml);
        $('#editorcontrols').show();
	$('#content').on('click', '#editor_compile', doCompile);
}

