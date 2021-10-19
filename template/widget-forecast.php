
<?php
$forecasts = array();

foreach($times as $event=>$data) {
    #print '<p>'.$event.'</p>';
    if (strpos($event,'inshore')) {
        $index = substr($event,18);
        $index = substr($index, 0,strlen($index)-5);
        $forecasts[$index] = $data;
    }
}
$area = 10;
$forecast = $forecasts[$area];
$name = $forecast['area'];
$warning = $forecast['warning'];


?>

<?php if (isset($forecast['forecast'])): ?>
    <div class="uk-width-1-1">
        <div class="uk-margin-left font-forecast uk-panel uk-panel-box">
            <div class="uk-grid">
                <div class="uk-width-1-1">
                    <div class="uk-text-bold">
                        <?php print 'FORECAST:'.$name; ?>
                    </div>
                </div>
                <?php if (strlen($warning)>0): ?>
                    <div class="uk-width-1-1">
                        <div class="uk-alert-danger uk-text-bold">
                            <?php print $warning; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <?php if (isset($forecast['forecast'])): ?>
                    <?php foreach ($forecast['forecast'] as $key=>$info): ?>
                        <div class="uk-width-1-6 uk-text-bold">
                            <?php print strtoupper($key); ?>
                        </div>
                        <div class="uk-width-5-6">
                            <?php print $info; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
<?php endif; ?>

<?php if (isset($forecast['outlook'])): ?>
    <div class="uk-width-1-1">
        <div class="uk-margin-left font-forecast uk-panel uk-panel-box">
            <div class="uk-grid">
                <div class="uk-width-1-1">
                    <div class="uk-text-bold">
                        <?php print 'OUTLOOK:'.$name; ?>
                    </div>
                </div>
                <?php if (strlen($warning)>0): ?>
                    <div class="uk-width-1-1">
                        <div class="uk-alert-danger uk-text-bold">
                            <?php print $warning; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <?php if (isset($forecast['outlook'])): ?>
                    <?php foreach ($forecast['outlook'] as $key=>$info): ?>
                        <div class="uk-width-1-6 uk-text-bold">
                            <?php print strtoupper($key); ?>
                        </div>
                        <div class="uk-width-5-6">
                            <?php print $info; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
<?php endif; ?>
