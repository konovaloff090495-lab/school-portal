#!/bin/bash
cd /Users/dmitriikonovalov/claude/school-portal/scripts/reshak
while read path name; do
  [ -f raw/$name.json ] && continue
  python3 harvest.py "$path" "$name" > logs/$name.log 2>&1
done << LIST
/reshebniki/ximiya/10/gabrielyan/index.html gabrielyan10
/reshebniki/ximiya/11/gabrielyan/index.html gabrielyan11
/reshebniki/ximiya/10/rudsitis/index.html rudzitis10
/reshebniki/ximiya/11/rudsitis/index.html rudzitis11
/reshebniki/ximiya/7/gabrielyan/index.html gabrielyan7
/reshebniki/istoria/5/vigasin/index.html vigasin5
/reshebniki/geograph/5/alexeev_nikolina/index.html alekseev5
/reshebniki/geograph/6/gerasimova/index.html gerasimova6
/reshebniki/istoria/6/agibalova/index.html agibalova6
/reshebniki/istoria/6/arsentev/index.html arsentev6
LIST
echo ALLDONE >> logs/harvest_many.log
