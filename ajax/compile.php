<?php
/*
 * TODO
 * All calls will be cleaned by this function.
 */

//in production run please set this to 0
$debug=0;

class Purify_Latex{
    static $blacklisted=array("\write18", "\input{|");
    private $_error_message;
    static public function cleanFileName($f) {
        return escapeshellarg($f);
    }
    /**
     *This function should clean latex file based on blacklisted commands.
     * @param string $f
     * @return bool 
     */
    static public function cleanFileContent($f) {
        $huge_str=file_get_contents($f);
        $huge_str = str_replace(' ','',$huge_str);
        $this->_error_message=array();
        foreach (self::blacklisted as $key => $s) {
            $pos = strpos($huge_str, $s);
            if ($pos !== false) {
                $this->_error_message[]="Error command: ".$s." is not allowed!!!!";
                return false;
                break;
            }
        }
        
        return true;
    }
}

// Check if we are a user
OCP\JSON::checkLoggedIn();

// Get translator
$l = OC_L10N::get('files_latexeditor');

set_time_limit(0); //scanning can take ages

$dir = isset($_POST['path']) ? $_POST['path'] : '';
$pdflatex = isset($_POST['pdflatex']) ? (bool) $_POST['pdflatex'] : false;
$file = isset($_POST['filename']) ? $_POST['filename'] : '';

$userid = OCP\USER::getUser();
// The real directory file
$workdir = dirname(\OC\Files\Filesystem::getLocalFile(stripslashes($dir). $file));
$info = pathinfo($file);
$fileext = '.' . $info['extension'];
$projectname = trim(basename($file, $fileext));
$pdffile = $projectname . '.pdf';
$dvifile = $projectname . '.dvi';
$psfile = $projectname . '.ps';
$tocfile = $projectname . '.toc';
$logfile = $projectname . '.log';

// As we will write pdf/ps file(s) in the $dir, we need to known if it's writable
if(!\OC\Files\Filesystem::isCreatable(stripslashes($dir))) {
    OCP\JSON::error(array('data' => array('message' => 'As you don\'t have write permission in the owner directory, it\'s not possible to create output latex files.', 'output' => ''))); 
    exit();
}

$outpath = "/tmp/latex_" . $userid . "_" . $projectname;

$mkdir_command = "mkdir -p  " . $outpath ;
$cd_command = "cd " . str_replace(' ','\ ',trim($workdir)) ;
if ($pdflatex === true)
    $latex_command .= "pdflatex -interaction=batchmode -output-directory $outpath $file";
else
    $latex_command .= "latex -interaction=batchmode -output-directory=$outpath  $file ; cd $outpath; dvips  $dvifile ; ps2pdf $psfile";
if($debug)
$output = "========BEGIN COMPILE $projectname ======== \n "; // % $latex_command\n";

$return = shell_exec($mkdir_command . " && " . $cd_command . " && " . $latex_command);
$log = file_get_contents($outpath . '/' . $logfile);

$reruncount=0;
while (preg_match('/Rerun to get cross-references right/',$log) || preg_match('/No file '.$tocfile.'/',$log) || $reruncount>4){
	$return = shell_exec($cd_command . " && " . $latex_command);
	$log = file_get_contents($outpath . '/' . $logfile);	
        $reruncount++;       
}
if($reruncount>4){
    $looperror="\n!!!! Error: Something went wrong please write a Bug report to https://github.com/arm2arm/files_latexeditor \n info: Loop number > 4\n";
    file_put_contents($outpath . '/' . $logfile, $looperror, FILE_APPEND);
    
}
$cleanup = "rm -rf $outpath";

// ! at begining of a line indicate an error!
$errors = preg_grep("/^!/",explode("\n",$log)) ;
if ( empty($errors) === false ) {
    $log_array = explode("\n",$log);
    $error = "\n";
    foreach ( $errors as $line => $msg ) {
	for ( $i = $line ; $i <= $line + 5 ; $i++)
		$error .=  $log_array[$i]."\n";
    }
    OCP\JSON::error(array('data' => array('message' => $l->t('Compile failed with errors').' - <br/>', 'output' => nl2br($output . " % " . $latex_command . "\n" . $error ."\n>>>> BEGIN LOG FILE<<<<\n". file_get_contents($outpath . '/' . $logfile)."\n>>> END LOG FILE <<<\n" ))));

   shell_exec($cleanup);
    exit;
}

// No PDF File !?
if (!file_exists($outpath . '/' . $pdffile)) {
    OCP\JSON::error(array('data' => array('message' => $l->t('Compile failed with errors').':<br/>', 'output' => nl2br($output . " % ". $latex_command."\n" . file_get_contents($outpath . '/' . $logfile)) )));
    shell_exec($cleanup);
    exit;
};


 if($debug){
$output .= $return;
$output .= "\n========END COMPILE==========\n";
 }

if(file_exists($workdir . '/' . $pdffile))
	\OC\Files\Filesystem::unlink($workdir . '/' . $pdffile);
if (!$pdflatex && file_exists($workdir . '/' . $psfile) )
	\OC\Files\Filesystem::unlink($workdir . '/' . $psfile);

if (!@rename(trim($outpath . '/' . $pdffile), trim($workdir . '/'. $pdffile))) {
    $errors = error_get_last();
    $output.="\n>>>> " . $l->t("COPY ERROR: ") . $errors['type'];
    $output.="\n>>>> " . "<br />\n" . $errors['message'];
    $output.="<strong>" . trim($outpath . '/' . $pdffile) . " to " . trim($workdir . '/' . $pdffile) . "</strong>";
} else {
   if($debug)
    $output.="<strong> Copy " . trim($outpath . '/' . $pdffile) . " to " . trim($workdir . '/' . $pdffile) . "</strong>";
   
    if (!$pdflatex) {
        if (!@rename(trim($outpath . '/' . $psfile), trim($workdir . '/' . $psfile))) {
            $errors = error_get_last();
            $output.="\n>>>> " . $l->t("COPY ERROR: ") . $errors['type'];
            $output.="\n>>>> " . "<br />\n" . $errors['message'];
        } else
	    $output.=" <strong> Copy " . trim($outpath . '/' . $psfile) . "</strong>";
    }
}
if($debug)
$output.="\n>>>> " . $l->t("COPY DONE: ") . "\n";

$output.="Success...\n" . $l->t("please review pdf file") . "\n";

$target = OCP\Files::buildNotExistingFileName(stripslashes($workdir), $pdffile);
$target = \OC\Files\Filesystem::normalizePath($target);
$meta =  \OC\Files\Filesystem::getFileInfo($target);
if (!$pdflatex) {
    $target = OCP\Files::buildNotExistingFileName(stripslashes($workdir), $psfile);
    $target = \OC\Files\Filesystem::normalizePath($target);
    $meta =  \OC\Files\Filesystem::getFileInfo($target);
} 

OCP\JSON::success(array('data' => array('output' => nl2br($output), 'path' => $dir, 'pdffile' => $pdffile, 'psfile' => $psfile, 'logfile' => $logfile)));
shell_exec($cleanup);
