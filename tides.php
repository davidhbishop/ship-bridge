<?php

	//Load JSON file
	$filename = "navigation/tides.json";
	$strJsonFileContents = file_get_contents($filename);
	$calendar = json_decode($strJsonFileContents,true);
