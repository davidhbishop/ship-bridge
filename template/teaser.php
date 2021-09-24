<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;

?>
<div class="uk-grid uk-grid-small">
    <?php foreach($days as $key=>$value): ?>
        <?php
            $use = true;
            $data = null;
            $event = null;
            $highlight = '';

            $current_date = strval($key);

            if ($current_date == $target_date) {
                $use = false;
            }
            if ($current_date == $today_date) {
                $highlight = 'uk-panel-box-primary';
            }



        ?>

        <?php if ($use): ?>
            <div class="uk-width-1-6">
                <?php print '<a href="?date='.$current_date.'">'?>
                <?php print '<div class="uk-panel uk-panel-box '.$highlight.'">'?>
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
                <?php print '</a>'; ?>
            </div>
        <?php endif; ?>
    <?php endforeach; ?>
</div>
