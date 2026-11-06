import unittest,sqlite3,tempfile,pathlib,importlib.util,json,contextlib,io,datetime
spec=importlib.util.spec_from_file_location('measurement',pathlib.Path(__file__).with_name('measurement.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class FunnelReportTests(unittest.TestCase):
 def test_pre_activation_is_unknown_not_zero(self):
  s=m.summarize({'tracking_v2_available':False,'legacy_unclassified_events':[{'count':4}]});self.assertFalse(s['available']);self.assertIn('unknown',s['reason']);self.assertNotIn('counts_nonqa',s)
 def test_real_sql_exports_aggregates_and_one_journey_three_leads_is100pct(self):
  with tempfile.TemporaryDirectory()as d:
   db=pathlib.Path(d)/'test.sqlite';c=sqlite3.connect(db)
   c.executescript('CREATE TABLE results(id TEXT);CREATE TABLE requests(offer_id TEXT,status TEXT);CREATE TABLE event_counts(day TEXT,event TEXT,landing TEXT,offer_id TEXT,grade INTEGER,count INTEGER);CREATE TABLE funnel_meta(key TEXT,value TEXT);CREATE TABLE funnel_counts(day TEXT,event TEXT,landing TEXT,offer_id TEXT,grade INTEGER,cohort TEXT,is_test INTEGER,step INTEGER,elapsed_bucket TEXT,count INTEGER);CREATE TABLE funnel_events(event_key TEXT,journey_hash TEXT,occurred INTEGER,day TEXT,event TEXT,landing TEXT,offer_id TEXT,grade INTEGER,cohort TEXT,is_test INTEGER,step INTEGER,elapsed_bucket TEXT,expires INTEGER);')
   c.execute('INSERT INTO funnel_meta VALUES(?,?)',('activated_at_utc','2026-11-06T10:45:00Z'))
   n=1793962800000;rows=[]
   def event(kind,offer='',step=0,qa=0,journey='anonymous-HMAC-only'):
    nonlocal n;n+=1000;rows.append(('event-'+str(n),journey,n,'2026-11-06',kind,'/proforientaciya/',offer,7,'qa'if qa else'organic',qa,step,'3_7m',n+30*86400000))
   event('career_landing_view');event('career_test_start');event('career_question_view',step=1);event('career_question_answered',step=1);event('career_question_view',step=2);event('career_test_complete');event('career_result_saved')
   for offer in ['easycode-trial','ukids-diagnostic','synergy-school']:event('career_offer_view',offer);event('career_partner_request_saved',offer);event('career_crm_delivered',offer)
   event('career_landing_view',qa=1,journey='QA-HMAC-only');c.executemany('INSERT INTO funnel_events VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',rows)
   c.execute('INSERT INTO funnel_counts SELECT day,event,landing,offer_id,grade,cohort,is_test,step,elapsed_bucket,count(*) FROM funnel_events GROUP BY day,event,landing,offer_id,grade,cohort,is_test,step,elapsed_bucket');c.commit();c.close()
   cfg={'date1':'2026-11-06','date2':'2026-11-12','paths':['/proforientaciya/']};code=m.REMOTE.replace('__CONFIG__',repr(cfg)).replace('file:/var/lib/proschools-career/career.sqlite3','file:'+str(db));out=io.StringIO()
   with contextlib.redirect_stdout(out):exec(compile(code,'remote-export','exec'),{})
   raw=json.loads(out.getvalue());self.assertNotIn('anonymous-HMAC-only',out.getvalue());self.assertNotIn('QA-HMAC-only',out.getvalue());summary=m.summarize(raw);self.assertEqual(summary['counts_nonqa']['career_partner_request_saved'],3);self.assertEqual(summary['cohorts']['organic']['stage_journeys']['career_partner_request_saved'],1);self.assertEqual(summary['cohorts']['organic']['unique_request_conversion_pct'],100);self.assertTrue(all(r['request_conversion_pct']==100 for r in summary['partners']));self.assertEqual(raw['question_steps'][1]['observed_without_answer'],1)
 def test_zero_denominator_is_null(self):self.assertIsNone(m.ratio(0,0));self.assertIsNone(m.ratio(3,0))
if __name__=='__main__':unittest.main()
