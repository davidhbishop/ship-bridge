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
                    <div class="uk-width-1-6">
                        <div><h1><?php print $value['dayofmonth'];?></h1></div>
                        <div><h2><?php print $value['dayofweek']; ?></h2></div>
                    </div>
                    <div class="uk-width-5-6">
                        <table class="uk-table">
                            <thead>
                                <th>Time</th>
                                <th>Depth</th>
                                <th>Type</th>
                            </thead>
                            <?php foreach($value['times'] as $event=>$data):?>
                                    <tr>
                                        <td><?php print $data['time']?></td>
                                        <td><?php print $data['depth']?></td>
                                        <td><?php print $data['type']?></td>
                                    </tr>
                            <?php endforeach; ?>
                        </table>
                    </div>
        <?php endif; ?>
    <?php endforeach; ?>

</div>
