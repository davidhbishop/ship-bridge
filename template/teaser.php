<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;
    $day_count = 0;
    $tease_width = 'uk-width-1-2';

?>
<div class="uk-grid uk-grid-small">
    <div class="uk-width-1-3">
        <div class="uk-grid uk-grid-small">
            <?php foreach($days as $key=>$value): ?>
                <?php
                    $use = true;
                    $data = null;
                    $event = null;
                    $highlight = '';
                    $day_count++;

                    $current_date = strval($key);

                    if ($current_date == $target_date) {
                        $highlight = 'uk-panel-box-primary';
                    }

                    $day_row_count = 0;
                    if ($day_count == 3) {
                        print '</div></div><div class="uk-width-2-3"><div class="uk-grid uk-grid-small">';
                    }
                    if ($day_count > 2) {
                        $tease_width = 'uk-width-1-5';
                    }


                ?>

              <?php if ($use): ?>
                <?php print '<div class="'.$tease_width.'">'; ?>
                    <?php print '<a href="?date='.$current_date.'">'?>
                    <?php print '<div class="uk-panel uk-panel-box '.$highlight.'">'?>
                        <div class="uk-grid uk-grid-small">
                            <div class="uk-width-medium-1-4 uk-width-1-1">
                                <div class="uk-text-large"><?php print $value['dayofmonth'];?></div>
                                <div><?php print $value['dayofweek']; ?></div>
                            </div>
                            <div class="uk-width-3-4 uk-hidden-small">
                                <table>
                                    <?php foreach($value['times'] as $event=>$data):?>

                                        <?php $show_tide = false; ?>

                                        <?php if (strpos($event,'conwy')): ?>
                                            <?php if (strpos($event,'highwater')): ?>
                                                <?php $show_tide = true; ?>
                                            <?php endif; ?>
                                            <?php if (strpos($event,'lowwater')): ?>
                                                <?php $show_tide = true; ?>
                                            <?php endif; ?>
                                        <?php endif; ?>

                                        <?php if ($show_tide): ?>
                                            <?php $day_row_count++;?>
                                            <tr>
                                                <td class="uk-text-small uk-text-bold"><?php print $data['time']?></td>
                                                <td class="uk-text-small"><?php print $data['depth']?></td>
                                            </tr>
                                        <?php endif; ?>

                                    <?php endforeach; ?>
                                    <?php if ($day_row_count == 3):?>
                                        <tr>
                                            <td class="uk-text-small">&nbsp;</td>
                                            <td class="uk-text-small">&nbsp;</td>
                                        </tr>

                                    <?php endif; ?>
                                </table>
                            </div>
                        </div>
                    <?php print '</a>'; ?>
                    </div>
                </div>
            <?php endif; ?>
           <?php endforeach; ?>
        </div>
    </div>
</div>
