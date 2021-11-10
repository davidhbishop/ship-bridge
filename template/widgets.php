<?php
    foreach($days as $key=>$value){
        $use = false;
        $data = null;
        $event = null;
        $current_date = strval($key);

        if ($current_date == $target_date) {
            $times = $value['times'];
        }
    }
?>

<?php include 'teaser.php' ?>


<div class="uk-grid uk-width-1-1">
    <?php include 'widget-date.php'?>
    <?php include 'widget-forecast.php'?>
    <?php include 'widget-tidal.php'?>
    <?php include 'widget-weather.php'?>
    <?php include 'widget-sense.php'?>
    </div>
<?php include 'pressure-maps.php'?>
