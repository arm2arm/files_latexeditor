<?php

// Check if we are a user
OCP\JSON::checkLoggedIn();

//$debug=1;
function my_shell_exec($cmd) {
    if (isset($debug))
        return $cmd;
    return shell_exec($cmd);
}

set_time_limit(0); //scanning can take ages

$dir = isset($_POST['path']) ? $_POST['path'] : '';
$pdflatex = isset($_POST['pdflatex']) ? (bool) $_POST['pdflatex'] : false;
$file = isset($_POST['filename']) ? $_POST['filename'] : '';

$userid = OCP\USER::getUser();
$filesfoldername = \OCP\Config::getSystemValue('datadirectory') . '/' . $userid . '/files';
$userDirectory = $filesfoldername;
$info = pathinfo($file);
$fileext = '.' . $info['extension'];
$projectname = trim(basename($file, $fileext));
$onlyfile = basename($file, $fileext);
$pdffile = trim(basename($file, $fileext) . '.pdf');
$dvifile = trim(basename($file, $fileext) . '.dvi');
$psfile = trim(basename($file, $fileext) . '.ps');
$logfile = trim(basename($file, $fileext) . '.log');

$uid = "latex_$userid" . "_" . $projectname;
$outpath = "/tmp/$uid";
$workdir = $userDirectory . $dir;

if ($pdflatex === true)
    $command = "mkdir -p  $outpath && cd $workdir && pdflatex -output-directory $outpath  $file";
else
    $command = "mkdir -p  $outpath && cd $workdir && latex -output-directory=$outpath  $file ; cd $outpath; dvips  $dvifile ; ps2pdf $psfile";
$output = "\n========BEGIN COMPILE==========$psfile\n$command\n";

$output.=shell_exec($command);
$output.="\n========END COMPILE==========\n";



$cleanup = "rm -fr $outpath";



$output.= "$outpath/$pdffile\n";
$output.="$outpath/$logfile\n";
//$output.="RAW LOG:: $dir/$logfile";

if (!file_exists("$outpath/$pdffile")) {
    OCP\JSON::error(array('data' => array('message' => 'Compile failed with errors', 'output' => nl2br($output))));
    exit;
};

OC_Files::delete($dir, $pdffile);
OC_Files::delete($dir, $logfile);
if (!$pdflatex)
    OC_Files::delete($dir, $psfile);

//$output.="\n>>>> $outpath/$pdffile $workdir$pdffile\n".copy(trim($outpath.'/'.$pdffile), trim($workdir.$pdffile))."\n";

if (!@rename(trim($outpath . '/' . $pdffile), trim($workdir . $pdffile))) {
    $errors = error_get_last();
    $output.="\n>>>> " . "COPY ERROR: " . $errors['type'];
    $output.="\n>>>> " . "<br />\n" . $errors['message'];
    $output.="<strong>" . trim($outpath . '/' . $pdffile) . " to " . trim($workdir . $pdffile) . "</strong>";
} else {
    $output.="<strong>" . trim($outpath . '/' . $pdffile) . " to " . trim($workdir . $pdffile) . "</strong>";
    if (!$pdflatex) {
        if (!@rename(trim($outpath . '/' . $psfile), trim($workdir . $psfile))) {
            $errors = error_get_last();
            $output.="\n>>>> " . "COPY ERROR: " . $errors['type'];
            $output.="\n>>>> " . "<br />\n" . $errors['message'];
        } else {
            
        }
    }
}

$output.="\n>>>> " . "COPY DONE: \n";
$output.="<strong>" . trim($outpath . '/' . $psfile) . "</strong>";
//$output.="\n>>>> ";
//$output.=shell_exec($movepdf);
//$output.="\n <<<<";
//$output.="\n" . shell_exec($cleanup);
//$output.="\n$movepdf\n$cleanup";
//OC_Files::newFile($dir, $pdffile, 'file');
$target = OCP\Files::buildNotExistingFileName(stripslashes($dir), $pdffile);
$meta = OC_FileCache_Cached::get($target);
if (!$pdflatex) {
    $target = OCP\Files::buildNotExistingFileName(stripslashes($dir), $psfile);
    $meta = OC_FileCache_Cached::get($target);
}




//OCP\JSON::success(array('data' => array('output' => nl2br($output), 'mime'=>$meta['mimetype'],'size'=>$meta['size'],'pdffile' => $pdffile, 'logfile' => $logfile)));
OCP\JSON::success(array('data' => array('output' => nl2br($output), 'path' => $dir, 'pdffile' => $pdffile, 'psfile' => $psfile, 'logfile' => $logfile)));
