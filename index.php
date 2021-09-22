<?php 
	$page = 0;
	$display = 'bw';
	if (isset($_GET['page'])) {
		$page = $_GET['page'];
	};
	if (isset($_GET['display'])) {
		$display = $_GET['display'];
	}
	$forward = $page+1;
	$back = $page-1;

	//Load JSON file
	$filename = "navigation/data.json";
	$strJsonFileContents = file_get_contents($filename);
	$forecasts = json_decode($strJsonFileContents,true);
	$situation = $forecasts[0]['general'];
	$stamp = $forecasts[0]['stamp'];

include 'header.php';

?>



	<?php if ($display=="bw") {
			print '<img class="uk-width-1-1" src="navigation/chartBW'.$page.'.gif" alt="">';
		}?>
	<?php if ($display=="colour") {
			print '<img class="uk-width-1-1" src="navigation/chartColour'.$page.'.gif" alt="">';
		}?>

    <?php if ($display=="forecast") { ?>

        <div class="uk-grid">
            <div class="uk-width-2-3">

                <?php
                if ($page > 0) {
                    $area = $page;
                    $forecast = $forecasts[$area];
                    $name = $forecast['area'];
                    $warning = $forecast['warning'];
                    $now = $forecast['forecast'][0];
                    if (isset($forecast['forecast'][1])) {
                        $outlook = $forecast['forecast'][1];
                    }
                    print '<div class="uk-grid"><div class="uk-width-1-1 uk-margin-large-bottom"><h2>'.$name.'</h2></div>';
                    if (strlen($warning)>0) {
                        print '<div class="uk-width-1-1 uk-alert-danger"><h3>' . $warning . '</h3></div>';
                    }
                    print '<div class="uk-width-1-2"><div class="uk-grid">';
                    print '<div class="uk-width-1-1 uk-margin-bottom"><h3>Forecast</h3></div>';
                    foreach ($now as $key=>$value){
                        print '<div class="uk-width-1-6 uk-margin-bottom"><strong>'.$key.'</strong></div><div class="uk-width-5-6 uk-margin-bottom">'.$value.'</div>';
                    }
                    print '</div></div><div class="uk-width-1-2"><div class="uk-grid">';
                    if (count($outlook)>0) {
                        print '<div class="uk-width-1-1 uk-margin-bottom"><h3>Outlook</h3></div>';
                        foreach ($outlook as $key=>$value){
                            print '<div class="uk-width-1-6 uk-margin-bottom"><strong>'.$key.'</strong></div><div class="uk-width-5-6 uk-margin-bottom">'.$value.'</div>';
                        }
                    }
                    print '</div></div>';

                    print '</div>';

                } else {
                    print "<div class='uk-grid uk-grid-collapse'>";

                    foreach ($forecasts as $key=>$forecast) {
                        $area = $key;
                        print '<div class="uk-width-1-2"><a class="uk-width-1-1 uk-button uk-align-left" href="?display=forecast&page='.trim($area).'">'.$forecast["area"].'</a></div>';
                    }

                    print "</div>";
                }

                ?>
            </div>
            <div class="uk-width-1-3">
                <img src="navigation/inshore-map.png"/>
            </div>
        </div>

    <?php } ?>


 </body>

</html>
