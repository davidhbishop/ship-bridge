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

        if ($current_date == $today_date) {
            $use = true;
        }
        ?>

        <?php if ($use): ?>
                    <div class="uk-width-1-2">
                        <div><h1><?php print $value['dayofmonth'];?></h1></div>
                        <div><h2><?php print $value['dayofweek']; ?></h2></div>
                        <div class="uk-grid uk-grid-colapse">
                            <div class="uk-width-1-2"><?php print '<img src="/data/forecast/'.$current_date.'/0000-pressure-map-analysis-bw.gif"/>'; ?></div>
                            <div class="uk-width-1-2"><?php print '<img src="/data/forecast/'.$current_date.'/0000-pressure-map-analysis-colour.gif"/>'; ?></div>
                            <div class="uk-width-1-2"><?php print '<img src="/data/forecast/'.$current_date.'/1200-pressure-map-outlook-bw-12-hrs.gif"/>'; ?></div>
                            <div class="uk-width-1-2"><?php print '<img src="/data/forecast/'.$current_date.'/1200-pressure-map-outlook-colour-12-hrs.gif"/>'; ?></div>
                        </div>
                    </div>
                    <div class="uk-width-1-2">
                        <table class="uk-table">
                            <thead>
                                <th>Time</th>
                                <th>Type</th>
                                <th>Depth</th>
                                <th>Direction</th>
                                <th>Speed</th>
                                <th>Gusts</th>
                            </thead>
                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php if (strpos($event,'conwy')): ?>
                                    <tr>
                                        <td><?php print $data['time']?></td>
                                        <td><?php print $data['type']?></td>
                                        <td><?php print $data['depth']?></td>
                                        <td><?php print $data['D']?></td>
                                        <td><?php print $data['S']?></td>
                                        <td><?php print $data['G']?></td>
                                    </tr>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </table>
                    </div>
        <?php endif; ?>
    <?php endforeach; ?>

</div>
