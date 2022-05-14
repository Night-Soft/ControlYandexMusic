#!/bin/bash
function getVersion () {
echo "getVersion()"
local manifestJson="./manifest.json"
local counter=0
local null=0
local six=6
local localVersion=""
# get string version from json
while IFS= read -r line
do
 if ((counter == six)); then
   localVersion="$line"
   echo "$localVersion"
 fi
  ((counter++))
done < "$manifestJson"
 size=${#localVersion}
#echo "$size lenght"

# get postion of quote 
comma='"' 
lastCommaPos=0
commaPos=0

for ((i=size; i >= 1; i--))
do
if [[ "${localVersion:${i}:1}" == *"$comma"* ]]; then
  if ((lastCommaPos == null)); then
  lastCommaPos=$i
  #echo "lastCommaPos = $i"
  fi
  if ((commaPos == null && lastCommaPos != i)); then
  commaPos=$i
  #echo "commaPos = $i"
  break
  fi
fi
done

commaPos=$((commaPos + 2)) # +2 correct cute
localVersion=$(echo "$localVersion" | cut -c $commaPos-$lastCommaPos)
version=$localVersion
}

notify-send --urgency=normal --expire-time=5000 "Start building"
listRelease="./ListRelease.txt"
list=""
version=""
name=""
counter=0
null=0

# get $list release and package name
while IFS= read -r line
do
 if ((counter > null)); then
   list="$list $line"
   else
   name="$line"
 fi
  ((counter++))
done < "$listRelease"
echo "$list"
echo "$name"
getVersion
name="$name $version".zip""
echo "$name"
echo "Start building"
zip "${name}" ${list}
echo "End building"
notify-send --urgency=normal --expire-time=5000 "End building"
