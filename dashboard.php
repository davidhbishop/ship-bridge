<?php

    //Read each of the files in this directory

    $days = array();
    $current_day = date_create();
    $today_date = date_format($current_day, "Ymd");

    for ($x = 0; $x < 7; $x++) {
        $day = array();
        $current_day = date_add($current_day, date_interval_create_from_date_string('1 days'));

        $day['dayofmonth'] = date_format($current_day, "d");
        $day['dayofweek'] = date_format($current_day,"D");
        $day['date']= date_format($current_day, "Ymd");
        $day['path'] = 'data/forecast/' . strval($day['date']) . '/conwy';

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
    }

?>


<?php include 'template/header.php' ?>

<?php include 'template/contents.php' ?>

<?php include 'template/footer.php' ?>