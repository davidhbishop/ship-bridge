<?php
    foreach($days as $key=>$value) {
        $current_date = strval($key);

        if ($current_date == $target_date) {
            $dayofweek = $value['dayofweek'];
            $dayofmonth = $value['dayofmonth'];
        }
    }
?>
<div class="uk-width-1-1">
    <div class="uk-margin-left">
        <h1><?php print $dayofweek; ?> <?php print $dayofmonth;?></h1>
            <p class='uk-text-bold'>Conwy, wales</p>
    </div>
</div>
