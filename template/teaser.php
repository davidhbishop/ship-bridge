<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;

?>
<div class="uk-grid uk-width-1-1">
    <?php foreach($days as $key=>$value): ?>
        <?php
            $use = true;
            $data = null;
            $event = null;

            $current_date = strval($key);

            if ($current_date == $today_date) {
                $use = false;
            }

        ?>

        <?php if ($use): ?>
            <div clas="uk-width-1-6">
                <div class="uk-grid uk-grid-small">
                    <div class="uk-width-1-4">
                        <div class="uk-text-large"><?php print $value['dayofmonth'];?></div>
                        <div><?php print $value['dayofweek']; ?></div>
                    </div>
                    <div class="uk-width-3-4">
                        <table>
                            <?php foreach($value['times'] as $event=>$data):?>
                                <?php if (strpos($event,'tide')): ?>
                                    <?php if (strpos($event,'conwy')): ?>
                                        <tr>
                                            <td class="uk-text-small"><?php print $data['time']?></td>
                                            <td class="uk-text-small"><?php print $data['depth']?></td>
                                        </tr>
                                    <?php endif; ?>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </table>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    <?php endforeach; ?>
</div>
