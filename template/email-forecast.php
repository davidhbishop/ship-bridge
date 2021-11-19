
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
    <h2><?php print 'FORECAST:'.$name; ?></h2>
                <?php if (strlen($warning)>0): ?>
                        <p><strong>
                            <?php print $warning; ?>
                            </strong></p>
                    </div>
                <?php endif; ?>
                <?php if (isset($forecast['forecast'])): ?>
                    <?php foreach ($forecast['forecast'] as $key=>$info): ?>
                        <h3>
                            <?php print strtoupper($key); ?>
                        </h3>
                        <p>
                            <?php print $info; ?>
                        </p>
                    <?php endforeach; ?>
                <?php endif; ?>
<?php endif; ?>

