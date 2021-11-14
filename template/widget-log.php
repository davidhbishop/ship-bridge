<div class="uk-width-1-1 uk-width-medium-1-2">
    <div class="uk-panel uk-panel-box uk-margin-top">
    <table class="uk-table uk-table-striped">
        <tr>
            <th>Time</th>
            <th>Wind</th>
            <th>Position</th>
            <th>Head</th>
            <th>Speed</th>
            <th>SOG</th>
            <th>COG</th>
        </tr>

        <?php $displayTime = true; ?>
        <?php foreach($times as $event=>$data):?>
            <?php
                $display = false;
                if (strpos($event, 'log')) {
                    $display = true;
                }

            ?>

            <?php if ($displayTime==true && $display==true): ?>
                <tr>
                    <td><?php print substr($event,0,4);?></td>
                    <td><?php print $data['wind-direction-true']?>&#176;(T) <?php print $data['wind-speed']?> Kts</td>
                    <td><?php print $data['latitude']?><br/><?php print $data['longitude']?></td>
                    <td><?php print $data['heading-true']?>&#176;(T)</td>
                    <td><?php print $data['speed-through-water']?> Kts</td>
                    <td><?php print $data['speed-over-ground']?> Kts</td>
                    <td><?php print $data['course-over-ground-true']?> &#176;(T)</td>
                </tr>
            <?php endif; ?>
        <?php endforeach; ?>
    </table>
    </div>
</div>
