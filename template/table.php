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
                                                    case 'HighWater': print 'High tide at a depth of <strong>'.$data['depth'].'</strong>'; break;
                                                    case 'LowWater' : print 'Low tide at a depth of <strong>'.$data['depth'].'</strong>'; break;
                                                    case 'sunset': print 'Sun set'; break;
                                                    case 'sunrise': print 'Sun rise'; break;
                                                    case 'gateopen': print '<strong>Gate open</strong>'; break;
                                                    case 'gateclose': print '<strong>Gate close</strong>'; break;
                                                    case 'datapoint': print 'Wind direction: <strong>'.$data['D'].'</strong> speed: <strong>'.$data['S'].' knots</strong> ('.$data['G'].'knots max)';break;
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
        <?php endif; ?>
    <?php endforeach; ?>

</div>
