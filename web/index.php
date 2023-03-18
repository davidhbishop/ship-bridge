<?php

include 'file.php';

$test = new File();
$test->load('0000-inshore-forecast-1.json');

print $test->contents;
