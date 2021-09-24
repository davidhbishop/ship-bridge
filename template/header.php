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

                	print '<a class="uk-button" href="/dashboard.php">Times</a></li>';
                	print '<a class="uk-button'.$activeBW.'" href="/?display=bw&page='.$page.'">Chart</a></li>';
                	print '<a class="uk-button'.$activeColour.'" href="/?display=colour&page='.$page.'">Colour</a></li>';
                	print '<a class="uk-button'.$activeForecast.'" href="/?display=forecast&page='.$page.'">Forecast</a></li>';
                	print '<div>'.$stamp.'</div>';
					?>

        			</div>
			</div>
			<?php if ($display=="bw"||$display=="colour") {
                    print '<div class="uk-navbar-content uk-navbar-flip"><div class="uk-button-group">/';
                    print '<a class="uk-button uk-button-primary" href="/?page='.$back.'&display='.$display.'">back</a></li>';
                    print '<a class="uk-button uk-button-primary" href="/?page='.$forward.'&display='.$display.'">forward</a></li>';
                    print '</div></div>';
				} else {
                    print '<div class="uk-navbar-content uk-navbar-flip"><div class="uk-button-group">/';
                    print '<a class="uk-button uk-button-primary" href="/?page=0&display=forecast">List</a></li>';
                    print '</div></div>';
                }

			?>
  		</nav>