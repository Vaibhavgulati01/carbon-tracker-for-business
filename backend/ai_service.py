import google.generativeai as genai
from config import Config
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AIService:
    model = None
    
    @classmethod
    def initialize(cls):
        """Initialize Gemini AI"""
        try:
            api_key = Config.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=api_key)
            cls.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Gemini AI initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {e}")
            return False
    
    @classmethod
    def generate_insights(cls, org_data, emission_summary, activities, calculations):
        """Generate AI-powered insights based on emission data"""
        
        if cls.model is None:
            cls.initialize()
        
        context = f"""
        You are an expert carbon emission analyst. Analyze the following emission data and provide insights.
        
        Organization: {org_data.get('name', 'Unknown')}
        Sector: {org_data.get('sector', 'Unknown')}
        
        Emission Summary:
        - Total Emissions: {emission_summary.get('total', 0)} tCO2e
        - Scope 1: {emission_summary.get('scope1', 0)} tCO2e
        - Scope 2: {emission_summary.get('scope2', 0)} tCO2e
        - Scope 3: {emission_summary.get('scope3', 0)} tCO2e
        
        Total Activities: {len(activities)}
        
        Top Emission Sources:
        """
        
        source_map = {}
        for calc in calculations:
            activity = next((a for a in activities if str(a.get('_id')) == calc.get('activity_id')), None)
            if activity:
                key = activity.get('subcategory', activity.get('category'))
                if key not in source_map:
                    source_map[key] = {'emissions': 0, 'scope': calc.get('scope')}
                source_map[key]['emissions'] += calc.get('co2e_tons', 0)
        
        sorted_sources = sorted(source_map.items(), key=lambda x: x[1]['emissions'], reverse=True)[:5]
        for source, data in sorted_sources:
            context += f"\n- {source}: {data['emissions']:.2f} tCO2e (Scope {data['scope']})"
        
        prompt = f"""
        {context}
        
        Based on this data, provide 4 specific, actionable insights in the following categories:
        
        1. ANOMALY: Identify any unusual patterns or spikes in emissions
        2. PREDICTION: Forecast emission trends for the next quarter
        3. RECOMMENDATION: Suggest specific actions to reduce emissions
        4. BENCHMARK: Compare performance to industry standards for {org_data.get('sector', 'this sector')}
        
        Format your response as PURE JSON ONLY with this structure (no markdown, no code blocks):
        {{
            "anomaly": {{"title": "...", "description": "...", "severity": "high/medium/low"}},
            "prediction": {{"title": "...", "description": "...", "trend": "increasing/decreasing/stable"}},
            "recommendation": {{"title": "...", "description": "...", "potential_reduction": "..."}},
            "benchmark": {{"title": "...", "description": "...", "percentile": "..."}}
        }}
        
        IMPORTANT: Return ONLY the JSON object. No explanations, no markdown formatting, no code blocks.
        Keep descriptions concise (2-3 sentences) and specific to the actual data provided.
        """
        
        try:
            response = cls.model.generate_content(prompt)
            response_text = response.text.strip()
            
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                response_text = response_text[start_idx:end_idx+1]
            
            insights = json.loads(response_text)
            logger.info("AI insights generated successfully")
            return insights
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.error(f"Response text: {response_text[:200]}")
            return cls._get_fallback_insights(emission_summary, org_data)
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return cls._get_fallback_insights(emission_summary, org_data)
    
    @classmethod
    def analyze_scenario(cls, org_data, emission_summary, scenario_query):
        """Analyze what-if scenarios"""
        
        if cls.model is None:
            cls.initialize()
        
        total = emission_summary.get('total', 0)
        scope1 = emission_summary.get('scope1', 0)
        scope2 = emission_summary.get('scope2', 0)
        scope3 = emission_summary.get('scope3', 0)
        
        prompt = f"""
        You are a carbon emission reduction strategist analyzing real company data.
        
        Current Situation:
        - Organization: {org_data.get('name')}
        - Sector: {org_data.get('sector')}
        - Total Emissions: {total:.2f} tCO2e
        - Scope 1 (Direct emissions): {scope1:.2f} tCO2e ({(scope1/total*100) if total > 0 else 0:.1f}%)
        - Scope 2 (Electricity): {scope2:.2f} tCO2e ({(scope2/total*100) if total > 0 else 0:.1f}%)
        - Scope 3 (Indirect): {scope3:.2f} tCO2e ({(scope3/total*100) if total > 0 else 0:.1f}%)
        
        User Question: {scenario_query}
        
        Provide a detailed, practical analysis including:
        1. **Emission Impact**: Calculate specific emission reductions in tCO2e
        2. **Affected Scopes**: Which scopes would be impacted and by how much
        3. **Implementation Timeline**: Realistic phases (short-term, medium-term, long-term)
        4. **Cost Estimates**: Initial investment and operational costs
        5. **ROI & Payback Period**: Expected return on investment
        6. **Challenges**: Key obstacles and how to overcome them
        7. **Action Steps**: Concrete next steps to implement
        
        Use the actual emission numbers provided above in your calculations.
        Be specific, data-driven, and actionable.
        Format your response in clear, well-structured paragraphs with headers.
        """
        
        try:
            logger.info(f"Sending scenario analysis to Gemini AI...")
            
            response = cls.model.generate_content(
                prompt,
                generation_config={
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'max_output_tokens': 2048,
                }
            )
            
            logger.info("AI scenario analysis completed successfully")
            
            if response.text:
                return response.text
            else:
                raise ValueError("Empty response from Gemini AI")
                
        except Exception as e:
            logger.error(f"Error analyzing scenario: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            
            return f"""**Analysis Based on Current Emissions**

**Current Status:**
- Total Emissions: {total:.2f} tCO2e
- Scope 1 (Direct): {scope1:.2f} tCO2e ({(scope1/total*100) if total > 0 else 0:.1f}%)
- Scope 2 (Electricity): {scope2:.2f} tCO2e ({(scope2/total*100) if total > 0 else 0:.1f}%)
- Scope 3 (Indirect): {scope3:.2f} tCO2e ({(scope3/total*100) if total > 0 else 0:.1f}%)

**General Recommendations for {org_data.get('sector', 'your')} sector:**

**1. Energy Efficiency (Scope 2 Focus)**
Implementing LED lighting and HVAC optimization could reduce electricity consumption by 20-30%.
- Potential savings: {scope2 * 0.25:.2f} tCO2e
- Investment: $50,000 - $200,000
- Payback period: 2-4 years

**2. Renewable Energy Transition (Scope 2)**
Installing solar panels or purchasing renewable energy certificates.
- 50% renewable switch could reduce: {scope2 * 0.5:.2f} tCO2e
- Investment: $500,000 - $2,000,000
- Payback period: 5-8 years

**3. Fleet Electrification (Scope 1)**
Transitioning 30% of vehicle fleet to electric vehicles.
- Potential reduction: {scope1 * 0.3:.2f} tCO2e
- Investment: $300,000 - $800,000
- Payback period: 3-6 years

**4. Supply Chain Optimization (Scope 3)**
Working with suppliers to reduce upstream emissions.
- Potential reduction: {scope3 * 0.15:.2f} tCO2e
- Investment: Minimal (process changes)
- Timeline: 6-12 months

**Next Steps:**
1. Conduct detailed energy audit
2. Get quotes from vendors for specific solutions
3. Apply for sustainability grants and incentives
4. Create phased implementation plan

**Note:** AI service is temporarily unavailable. Please try your question again or contact support if the issue persists.
"""
    
    @classmethod
    def _get_fallback_insights(cls, emission_summary, org_data):
        """Fallback insights if AI fails"""
        total = emission_summary.get('total', 0)
        scope1 = emission_summary.get('scope1', 0)
        scope2 = emission_summary.get('scope2', 0)
        scope3 = emission_summary.get('scope3', 0)
        
        return {
            "anomaly": {
                "title": "Emission Pattern Detected",
                "description": f"Your Scope 2 emissions represent {(scope2/total*100) if total > 0 else 0:.1f}% of total emissions. This is typical for {org_data.get('sector', 'most')} organizations.",
                "severity": "medium"
            },
            "prediction": {
                "title": "Emission Forecast",
                "description": "Based on current trends, maintaining these activity levels will result in similar emissions next quarter. Consider implementing reduction strategies.",
                "trend": "stable"
            },
            "recommendation": {
                "title": "Energy Efficiency Opportunity",
                "description": "Scope 2 emissions can be reduced through energy efficiency measures. LED lighting and HVAC optimization typically reduce electricity consumption by 20-30%.",
                "potential_reduction": "20-30% Scope 2"
            },
            "benchmark": {
                "title": "Industry Comparison",
                "description": f"For {org_data.get('sector', 'your')} sector, your emission intensity is within expected ranges. Continue monitoring and targeting gradual improvements.",
                "percentile": "Average"
            }
        }
