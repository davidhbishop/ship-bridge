<div class="uk-width-medium-1-2 uk-width-1-1">
    <div class="uk-panel uk-panel-box uk-margin-top">
    <table class="uk-table uk-table-striped">

        <?php foreach($times as $event=>$data):?>
            <?php
                $display = true;
                if (strpos($event,'sunrise')) {
                    $boldTime = true;
                }
                if (!strpos($event,'conwy')) {
                    $display = false;
                }
                if (strpos($event,'moon')) {
                    $display = false;
                }
                if (strpos($event, 'datapoint')) {
                    $display = false;
                }
            ?>

            <?php if (strpos($event,'conwy')): ?>
                <?php if ($display==true): ?>
                    <tr>
                        <?php if ($boldTime): ?>
                            <td class="uk-text-bold"><?php print $data['time']?></td>
                        <?php else: ?>
                            <td><?php print $data['time']?></td>
                        <?php endif; ?>
                        <td><?php
                            switch ($data['type']) {
                                case 'HighWater': print 'High tide <strong>'.$data['depth'].'m</strong>'; break;
                                case 'LowWater' : print 'Low tide <strong>'.$data['depth'].'m</strong>'; break;
                                case 'sunset': print 'Sun set'; break;
                                case 'sunrise': print 'Sun rise'; break;
                                case 'gateopen': print 'Gate open'; break;
                                case 'gateclose': print 'Gate close'; break;
                                default:
                                    print $data['type'];
                            } ?></td>
                    </tr>
                <?php endif; ?>
            <?php endif; ?>
            <?php
                if (strpos($event, 'sunset')){
                    $boldTime = false;
                }

            ?>
        <?php endforeach; ?>
    </table>
    </div>
</div>
