<?php

class CalendarControl {
	//properties
	public $today

	public function __construct() {
		$this->today = date_create();
	}


class CalendarDay {
	//properties
	public $date

	public function __construct($date) {
		if (!$date) {
			$date = date_create();
		}
	}
}
