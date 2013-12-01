<?php
// only load latex editor if the user is logged in
if (\OCP\User::isLoggedIn()) {
        OCP\Util::addStyle('files_latexeditor', 'DroidSansMono/stylesheet'); 
        OCP\Util::addStyle('files_latexeditor', 'style');  
        OCP\Util::addscript('files_latexeditor', 'editor');
        OCP\Util::addscript('files_latexeditor', 'vendor/ace/src-noconflict/ace');
}
?>
