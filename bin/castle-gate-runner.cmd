@ECHO off
SETLOCAL
SET "NODE_EXE=node"
"%NODE_EXE%" "%~dp0\castle-gate.js" %*
