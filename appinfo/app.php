<?php
//load the required files
OCP\Util::addStyle(  'files_latexeditor', 'style' );
OCP\Util::addscript( 'files_latexeditor', 'editor');
OCP\Util::addscript( 'files_latexeditor', 'aceeditor/ace');



//OCP\Util::addscript( 'files_pdfviewer', 'viewer');
//OCP\Util::addStyle( 'files_pdfviewer', 'viewer');
//OCP\Util::addscript( 'files_pdfviewer', 'pdfjs/build/pdf');
//OCP\Util::addscript( 'files_pdfviewer', 'pdfview');

OCP\Util::addscript( 'files_latexeditor', 'prettyprint');


?>
