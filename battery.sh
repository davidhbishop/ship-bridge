#!/bin/bash

upower -i $(upower -e | grep 'bat') 
