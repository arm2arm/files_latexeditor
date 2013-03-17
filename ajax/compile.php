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

$dir= isset($_POST['path']) ? $_POST['path'] : '';
$file = isset($_POST['filename']) ? $_POST['filename'] : '';

$userid = OCP\USER::getUser();
$filesfoldername = \OCP\Config::getSystemValue('datadirectory') . '/' . $userid . '/files';
$userDirectory = $filesfoldername;
$info = pathinfo($file);
$fileext = '.' . $info['extension'];
$projectname=trim(basename($file, $fileext) );
$pdffile = trim(basename($file, $fileext) . '.pdf');
$logfile = trim(basename($file, $fileext) . '.log');

$uid = "latex_$userid"."_".$projectname;
$outpath = "/tmp/$uid";
$workdir = $userDirectory . $dir;
#$filename="simple.tex";

$command = "mkdir -p  $outpath && cd $workdir && pdflatex -output-directory $outpath  $file";
$output = "\n========BEGIN COMPILE==========\n$command\n";
$output.=shell_exec(escapeshellarg($command));
$output.="\n========END COMPILE==========\n";



$cleanup = "rm -fr $outpath";
//echo $command;


$output.= "$outpath/$pdffile\n";
$output.="$outpath/$logfile\n";
//$output.="RAW LOG:: $dir/$logfile";

if(!file_exists("$outpath/$pdffile")){    
    OCP\JSON::error(array('data' => array( 'message' => 'Compile failed with errors', 'output'=>nl2br($output))));
    exit;
};

OC_Files::delete( $dir, $pdffile );
OC_Files::delete( $dir, $logfile );
//OC_Files::delete( $dir, $logfile );
//$output.="\n>>>> $outpath/$pdffile $workdir$pdffile\n".copy(trim($outpath.'/'.$pdffile), trim($workdir.$pdffile))."\n";

if(!@rename(trim($outpath.'/'.$pdffile), trim($workdir.$pdffile)))
{
    $errors= error_get_last();
    $output.="\n>>>> "."COPY ERROR: ".$errors['type'];
    $output.="\n>>>> ". "<br />\n".$errors['message'];
}   
$output.="\n>>>> "."COPY DONE: \n";
//$output.="\n>>>> ";
//$output.=shell_exec($movepdf);
//$output.="\n <<<<";
//$output.="\n" . shell_exec($cleanup);
//$output.="\n$movepdf\n$cleanup";


//OC_Files::newFile($dir, $pdffile, 'file');
$target = OCP\Files::buildNotExistingFileName(stripslashes($dir), $pdffile);
$meta=OC_FileCache::getCached($target);


//OCP\JSON::success(array('data' => array('output' => nl2br($output), 'mime'=>$meta['mimetype'],'size'=>$meta['size'],'pdffile' => $pdffile, 'logfile' => $logfile)));
OCP\JSON::success(array('data' => array('output' => nl2br($output),'path'=>$dir,'pdffile' => $pdffile, 'logfile' => $logfile)));
