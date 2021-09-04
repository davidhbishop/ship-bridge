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

?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>The Bridge</title>
    <link rel="stylesheet" href="css/uikit.gradient.min.css" />
    <style>
    </style>
</head>
 <body>
  		<nav class="uk-navbar">
			<div class="uk-navbar-content">
				<div class="uk-button-group">
					<?php
				$activeBW = '';
				$activeColour = '';
				$activeForecast = '';
				if ($display=="bw") $activeBW=' uk-active';
				if ($display=="colour") $activeColour=' uk-active';
				if ($display=="forecast") $activeForecast=' uk-active';

                	print '<a class="uk-button'.$activeBW.'" href="?display=bw&page='.$page.'">Chart</a></li>';
                	print '<a class="uk-button'.$activeColour.'" href="?display=colour&page='.$page.'">Colour</a></li>';
                	print '<a class="uk-button'.$activeForecast.'" href="?display=forecast&page='.$page.'">Forecast</a></li>';
                	print '<div>'.$stamp.'</div>';
					?>

        			</div>
			</div>
			<?php if ($display=="bw"||$display=="colour") {
                    print '<div class="uk-navbar-content uk-navbar-flip"><div class="uk-button-group">/';
                    print '<a class="uk-button uk-button-primary" href="?page='.$back.'&display='.$display.'">back</a></li>';
                    print '<a class="uk-button uk-button-primary" href="?page='.$forward.'&display='.$display.'">forward</a></li>';
                    print '</div></div>';
				} else {
                    print '<div class="uk-navbar-content uk-navbar-flip"><div class="uk-button-group">/';
                    print '<a class="uk-button uk-button-primary" href="?page=0&display=forecast">List</a></li>';
                    print '</div></div>';
                }

			?>
  		</nav>

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
