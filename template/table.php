<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;

?>
<div class="uk-grid uk-grid-collapse">
    <?php foreach($days as $key=>$value): ?>
        <?php
        $use = false;
        $data = null;
        $event = null;
        $current_date = strval($key);

        if ($current_date == $target_date) {
            $use = true;
        }
        ?>

        <?php if ($use): ?>
                    <div class="uk-width-1-3">
                        <div class="uk-panel uk-panel-box">
                            <div class="uk-panel-title"><h1><?php print $value['dayofweek']; ?> <?php print $value['dayofmonth'];?></h1></div>
                        </div>

                        <div class="uk-panel uk-panel-box">
                                <?php

                                $forecasts = array();

                                foreach($value['times'] as $event=>$data) {
                                    if (strpos($event,'inshore')) {
                                        $index = substr($event,18);
                                        $index = substr($index, 0,strlen($index)-5);
                                        $forecasts[$index] = $data;
                                    }
                                }

                                $area = $_GET['area'];

                                if ($area > 0) {
                                    $forecast = $forecasts[$area];
                                    $name = $forecast['area'];
                                    $warning = $forecast['warning'];
                                    $now = $forecast['forecast'][0];
                                    if (isset($forecast['forecast'][1])) {
                                        $outlook = $forecast['forecast'][1];
                                    }
                                    print '<div class="uk-panel-title">'.$name.'</div><div class="uk-panel-body">';
                                    if (strlen($warning)>0) {
                                        print '<div class="uk-alert-danger"><h3>' . $warning . '</h3></div>';
                                    }
                                    print '<h3>Forecast</h3>';
                                    foreach ($now as $key=>$info){
                                        print '<div><strong>'.$key.'</strong></div><div>'.$info.'</div>';
                                    }
                                    if (count($outlook)>0) {
                                        print '<div class="uk-margin-top"><h3>Outlook</h3></div>';
                                        foreach ($outlook as $key=>$info){
                                            print '<div><strong>'.$key.'</strong></div><div>'.$info.'</div>';
                                        }
                                    }

                                    print '</div>';

                                } else {
                                    print "<div class='uk-panel-body'><div class='uk-panel-title'>Forecasts</div>";

                                    foreach ($forecasts as $area=>$forecast) {
                                        if ($area > 9 && $area < 13) {
                                            print '<div><a class="uk-width-1-1 uk-button uk-align-left" href="?display=dashboard&area='.trim($area).'">'.$forecast["area"].'</a></div>';
                                        }
                                    }

                                    print "</div>";
                                }

                                ?>
                        </div>



                    </div>
                    <div class="uk-width-1-3">
                        <table class="uk-table">

                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php if (strpos($event,'conwy')): ?>
                                    <tr>
                                        <td><?php print $data['time']?></td>
                                        <td><?php print $data['type']?></td>
                                        <td><?php print $data['depth']?> <?php print $data['D']?> <?php print $data['S']?> <?php print $data['G']?></td>
                                    </tr>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </table>
                    </div>
                    <div class="uk-width-1-3">
                        <div class="uk-grid uk-grid-colapse">
                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php if (strpos($event,'pressure')): ?>
                                    <?php if (strpos($event,'colour')): ?>
                                        <div class="uk-width-1-1"><?php print '<img src="/data/forecast/'.$current_date.'/'.$event.'"/>'; ?></div>
                                    <?php endif; ?>
                                <?php endif; ?>
                            <?php endforeach; ?>




                        </div>
                    </div>
        <?php endif; ?>
    <?php endforeach; ?>

</div>
