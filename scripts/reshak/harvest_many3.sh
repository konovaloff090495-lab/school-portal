#!/bin/bash
cd /Users/dmitriikonovalov/claude/school-portal/scripts/reshak
while read path name; do
  [ -f raw/$name.json ] && grep -q '"answer"' raw/$name.json && [ "$(python3 -c "import json;print(len(json.load(open('raw/$name.json'))['items']))")" -gt 50 ] && continue
  python3 harvest.py "$path" "$name" > logs/$name.log 2>&1
done << LIST
/reshebniki/matematika/5/merzlyak/index.html merzlyak5
/reshebniki/matematika/6/merzlyak/index.html merzlyak6
/reshebniki/algebra/7/makarichev/index.php makarychev7
/reshebniki/algebra/8/makarichev2/index.html makarychev8
/reshebniki/algebra/9/makarichev/index.php makarychev9
/reshebniki/algebra/7/merzlyak/index.html merzlyak7a
/reshebniki/algebra/8/merzlyak/index.html merzlyak8a
/reshebniki/algebra/9/merzlyak/index.html merzlyak9a
/reshebniki/geometriya/7/atanasyan/index.php atanasyan79
/reshebniki/geometriya/10/atanasyan10-11/index.php atanasyan1011
/reshebniki/russkijazik/5/ladizhenskaya/index.html ladyzhenskaya5
/reshebniki/russkijazik/6/baranov/index.html baranov6
/reshebniki/russkijazik/7/baranov/index.php baranov7
/reshebniki/russkijazik/8/ladizhenskaya/index.html ladyzhenskaya8
LIST
echo ALLDONE >> logs/harvest_many3.log
