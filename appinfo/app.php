<?php
/**
 * ownCloud - fileslatexeditor
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Arman Khalatyan <arm2arm@gmail.com>
 * @copyright Arman Khalatyan 2015
 */

namespace OCA\FilesLatexeditor\AppInfo;

//load the required files
\OCP\Util::addscript( 'files_latexeditor', 'editor');
\OCP\Util::addStyle( 'files_latexeditor', 'style' );
//OCP\Util::addStyle( 'fileslatexeditor', 'highlight-default' );