files_latexeditor
=================

File Latex Editor/compiler APP for OwnCloud 5.x and above
The standard "Text Editor" must be enabled.

installation
=================
- run 'apt-get install texlive'
- change to owncloud app directory 'cd /var/www/owncloud/apps'
- now run 'git clone https://github.com/domcars0/files_latexeditor.git'
- open change to your webinterface and open the apps page <your-ip>/owncloud/index.php/settings/apps
- search for 'LatexTex Editor and Compiler' and activate it
 
note
=================
Latexeditor does not seem to work with the encryption app from ownloud

change log
=================
27.01.2014
Merge the erasche feature (Adds support for selection of LaTeX compiler) and bug fixe for multiple directories latex project.
Bug fixed when owncloud is not installed in the root of the webServer.
01.12.2013
Remove all the files_texteditor code.
We detect now if the editor is open and then add (or not) the Compile button.
30.11.2013
compatibility with OC5
If a shared directory contains a tex file, friends can compile.
Double compilation for cross references.
Detect latex errors.
tested on OC5.0.13

10.01.2013 
code cleaninig
tested on OC4.5.5

