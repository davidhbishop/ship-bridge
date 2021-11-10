<div class="uk-width-1-1 uk-width-medium-1-2">
    <div class="uk-panel uk-panel-box uk-margin-top">
    <table class="uk-table uk-table-striped">
        <tr>
            <th>Time</th>
            <th>Pressure</th>
            <th>Temperature</th>
            <th>Humidity</th>
        </tr>

        <?php $displayTime = true; ?>
        <?php foreach($times as $event=>$data):?>
            <?php
                $display = false;
                if (strpos($event, 'sensehat')) {
                    $display = true;
                }

            ?>
                <?php if ($displayTime==true && $display==true): ?>
                    <tr>
                        <td><?php print substr($event,0,4);?></td>
                        <td><?php print $data['pressure']?></td>
                        <td><?php print $data['temperature']?></td>
                        <td><?php print $data['humidity']?></td>
                    </tr>
                <?php endif; ?>
        <?php endforeach; ?>
    </table>
    </div>
</div>
