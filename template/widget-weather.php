<div class="uk-width-1-1 uk-width-medium-1-2">
    <div class="uk-panel uk-panel-box uk-margin-top">
    <table class="uk-table uk-table-striped">
        <tr>
            <th>Time</th>
            <th>Direction</th>
            <th>Speed</th>
            <th>Gust</th>
        </tr>

        <?php $displayTime = true; ?>
        <?php foreach($times as $event=>$data):?>
            <?php
                $display = false;
                if (strpos($event, 'datapoint')) {
                    $display = true;
                }

            ?>

            <?php if (strpos($event,'conwy')): ?>
                <?php if ($displayTime==true && $display==true): ?>
                    <tr>
                        <td><?php print $data['time']?></td>
                        <td><?php print $data['D']?></td>
                        <td><?php print $data['S']?></td>
                        <td><?php print $data['G']?></td>
                    </tr>
                <?php endif; ?>
            <?php endif; ?>
        <?php endforeach; ?>
    </table>
    </div>
</div>
