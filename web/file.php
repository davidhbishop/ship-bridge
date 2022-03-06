<?php

class File() {
	public $path;
	public $contents;
	public $json;

	function load($path) {
		$this->path = $path;
		$this->contents = file_get_contents($path, FILE_USE_INCLUDE_PATH);
		$this->json = json_decode($this->contents, true);
	}
}
