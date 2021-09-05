<?php

	//Load JSON file
	$filename = "navigation/tides.json";
	$strJsonFileContents = file_get_contents($filename);
	$calendar = json_decode($strJsonFileContents,true);

include 'header.php';

//print_r ($calendar[0]['conwy'][0]);

foreach ($calendar[0]['conwy'] as $key=>$value) {
 foreach ($value as $key2=>$value2) {
  $date = $key2;
  print $date.'<br/>';
  $year = substr($date,2,2);
  $month = substr($date,4,2);
  $day = substr($date,6,4);
  $tideString = $year.'-'.$month.'-'.$day;
  print $tideString.'<br/>';
  $tideDate = strtotime($year.'-'.$month.'-'.$day);
  print date("jS F, Y", $tideDate).'<br/>';
  foreach ($value2 as $key3=>$value3) {
//   print $value3[0].' '.$value3[1]. .$value3[2].'</br>';
   print_r ($value3);
   print '<br/>';
  }
 }
}

