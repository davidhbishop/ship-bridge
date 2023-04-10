<?php

class CalendarControl
{
    //properties
    public $today;

    public function __construct()
    {
        $this->today = new CalendarDay();
    }
}


class CalendarDay {
	//properties
	public $date;

	public function __construct($date = NULL) {
		if (!$date) {
			$date = date_create();
		}
	}
}
