<?php
    $key = null;
    $value = null;
    $event = null;
    $data = null;

?>
<div class="uk-slidenav-position" data-uk-slideshow>
    <ul class="uk-slideshow">
        <?php foreach($days as $key=>$value): ?>
        <?php
        $use = true;
        $data = null;
        $event = null;
        $current_date = strval($key);

        ?>
            <?php foreach($value['times'] as $event=>$data):?>
                <?php if (strpos($event,'pressure')): ?>
                    <?php if (strpos($event,'colour')): ?>
                        <?php $image_url = '/data/forecast/'.$current_date.'/'.$event; ?>
                        <li><?php print '<img src="'.$image_url.'"/>'; ?></li>
                    <?php endif; ?>
                <?php endif; ?>
            <?php endforeach; ?>
        <?php endforeach; ?>
    </ul>
    <a href="" class="uk-slidenav uk-slidenav-contrast uk-slidenav-previous" data-uk-slideshow-item="previous"></a>
    <a href="" class="uk-slidenav uk-slidenav-contrast uk-slidenav-next" data-uk-slideshow-item="next"></a>
</div>