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
                    <div class="uk-width-1-4">
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
                                    print '<div class="uk-panel-title">'.$name.'</div><div class="uk-panel-body">';
                                    if (strlen($warning)>0) {
                                        print '<div class="uk-alert-danger"><h3>' . $warning . '</h3></div>';
                                    }
                                    if (isset($forecast['forecast'])) {
                                        print '<h3>Forecast</h3>';
                                        foreach ($forecast['forecast'] as $key=>$info){
                                            print '<div><strong>'.$key.'</strong></div><div>'.$info.'</div>';
                                        }
                                    }
                                    if (isset($forecast['outlook'])) {
                                        print '<div class="uk-margin-top"><h3>Outlook</h3></div>';
                                        foreach ($forecast['outlook'] as $key=>$info){
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
                    <div class="uk-width-1-2">
                        <table class="uk-table">

                            <?php $displayTime = false; ?>
                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php
                                    $display = true;
                                    if (strpos($event,'sunrise')) {
                                        $displayTime = true;
                                    }
                                    if (!strpos($event,'conwy')) {
                                        $display = false;
                                    }
                                    if (strpos($event, 'moon')) {
                                        $display = false;
                                    }
                                    if (strpos($event, 'gateopen')) {
                                        $boldTime = true;
                                    }
                                ?>

                                <?php if (strpos($event,'conwy')): ?>
                                    <?php if ($displayTime==true && $display==true): ?>
                                        <tr>
                                            <?php if ($boldTime): ?>
                                                <td class="uk-text-bold"><?php print $data['time']?></td>
                                            <?php else: ?>
                                                <td><?php print $data['time']?></td>
                                            <?php endif; ?>
                                            <td><?php
                                                switch ($data['type']) {
                                                    case 'hightide': print 'High tide at a depth of <strong>'.$data['depth'].'</strong>'; break;
                                                    case 'lowtide' : print 'Low tide at a depth of <strong>'.$data['depth'].'</strong>'; break;
                                                    case 'sunset': print 'Sun set'; break;
                                                    case 'sunrise': print 'Sun rise'; break;
                                                    case 'gateopen': print '<strong>Gate open</strong>'; break;
                                                    case 'gateclose': print '<strong>Gate close</strong>'; break;
                                                    case 'datapoint': print 'Wind direction: <strong>'.$data['D'].'</strong> speed: <strong>'.$data['S'].'mph</strong> ('.$data['G'].'mph max)';break;
                                                    default:
                                                        print $data['type'];
                                                } ?></td>
                                        </tr>
                                    <?php endif; ?>
                                <?php endif; ?>
                                <?php
                                    if (strpos($event,'sunset')) {
                                        $displayTime = false;
                                    }
                                    if (strpos($event, 'gateclose')){
                                        $boldTime = false;
                                    }
                                ?>
                            <?php endforeach; ?>
                        </table>
                    </div>
                    <div class="uk-width-1-4">
                        <div class="uk-grid">
                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php if (strpos($event,'pressure')): ?>
                                    <?php if (strpos($event,'colour')): ?>
                                        <div class="uk-width-1-1 uk-margin-bottom"><?php print '<img src="/data/forecast/'.$current_date.'/'.$event.'"/>'; ?></div>
                                    <?php endif; ?>
                                <?php endif; ?>
                            <?php endforeach; ?>




                        </div>
                    </div>
        <?php endif; ?>
    <?php endforeach; ?>

</div>
