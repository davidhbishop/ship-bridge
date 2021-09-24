<?php

$days = array();
$current_day = date_create();
$today_date = date_format($current_day, "Ymd");

for ($x = 0; $x < 7; $x++) {
    $day = array();

    $day['dayofmonth'] = date_format($current_day, "d");
    $day['dayofweek'] = date_format($current_day,"D");
    $day['date']= date_format($current_day, "Ymd");
    $day['path'] = 'data/forecast/' . strval($day['date']);

    if (is_dir($day['path'])) {

        $files = scandir($day['path']);
        $files = array_diff($files, array('.','..'));
        $times = array();

        foreach($files as $key=>$file){
            $filepath = $day['path'] . '/' . $file;
            $string = file_get_contents($filepath, FILE_USE_INCLUDE_PATH);
            $json = json_decode($string, true);
            $times[$file] = $json;
        }
        $day['times'] = $times;
    }

    $days[$day['date']] = $day;
    $current_day = date_add($current_day, date_interval_create_from_date_string('1 days'));
}

	$page = 0;
	$display = 'dashboard';
	if (isset($_GET['page'])) {
		$page = $_GET['page'];
	};
	if (isset($_GET['display'])) {
		$display = $_GET['display'];
	}
	$forward = $page+1;
	$back = $page-1;

	//Load JSON file
	$filename = "navigation/data.json";
	$strJsonFileContents = file_get_contents($filename);
	$forecasts = json_decode($strJsonFileContents,true);
	$situation = $forecasts[0]['general'];
	$stamp = $forecasts[0]['stamp'];

    ?>

<?php include 'template/header.php'; ?>
<?php include 'template/teaser.php' ?>

    <?php if ($display=="dashboard") :?>
        <?php include 'template/table.php' ?>
    <?php endif; ?>

	<?php if ($display=="bw") {
			print '<img class="uk-width-1-1" src="navigation/chartBW'.$page.'.gif" alt="">';
		}?>
	<?php if ($display=="colour") {
			print '<img class="uk-width-1-1" src="navigation/chartColour'.$page.'.gif" alt="">';
		}?>

    <?php if ($display=="forecast") : ?>



    <?php endif;  ?>


 </body>

</html>
