<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;

?>
<div class="uk-grid">
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
                    <div class="uk-width-medium-1-4 uk-width-small-1-1">
			<div class="uk-margin-left">
                            <h1><?php print $value['dayofweek']; ?> <?php print $value['dayofmonth'];?></h1>
			    <p class='uk-text-bold'>Conwy, wales</p>

                        
                                <?php

                                $forecasts = array();

                                foreach($value['times'] as $event=>$data) {
				    print '<p>'.$event.'</p>';
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
                                    print '<p>'.$name.'</p>';
                                    if (strlen($warning)>0) {
                                        print '<div class="uk-alert-danger">' . $warning . '</div>';
                                    }
                                    if (isset($forecast['forecast'])) {
                                        print '<table class="uk-table uk-table-striped">';
                                        foreach ($forecast['forecast'] as $key=>$info){
                                            print '<tr><th>'.$key.'</th><td>'.$info.'</td></tr>';
                                        }
					print '</table>';
                                    }
                                    if (isset($forecast['outlook'])) {
                                        print '<table class="uk-table uk-table-striped">';
                                        foreach ($forecast['outlook'] as $key=>$info){
                                            print '<tr><th>'.$key.'</th><td>'.$info.'</td></tr>';
                                        }
                                    }
				    print '</table>';

				    print '<a href="?display=dashboard&date='.$current_date.'">Back</a>';
                                } else {
                                    print "<table class='uk-table uk-table-striped'>";

                                    foreach ($forecasts as $area=>$forecast) {
                                        if ($area > 9 && $area < 13) {
                                            print '<tr><td><a href="?display=dashboard&area='.trim($area).'&date='.$current_date.'">'.$forecast["area"].'</a></td></tr>';
                                        }
                                    }

                                    print "</table>";
                                }

                                ?>
			</div>
                    </div>
                    <div class="uk-width-medium-1-2 uk-width-small-1-1">
                        <table class="uk-table uk-table-striped">

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
                    <div class="uk-width-medium-1-4 uk-width-small-1-1">
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
