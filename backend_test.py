#!/usr/bin/env python3
"""
Backend API Testing for POS Rider System
Testing GPS API endpoints and route order fixes
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://reload-resolver.preview.emergentagent.com"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test basic API health"""
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                self.log_result("Health Check", True, "API is responding")
                return True
            else:
                self.log_result("Health Check", False, f"API returned {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def register_test_user(self):
        """Register a test user for authentication"""
        try:
            user_data = {
                "email": "gps.tester@posrider.com",
                "password": "TestPass123!",
                "full_name": "GPS Test User",
                "phone": "+6281234567890",
                "role": "admin"  # Need admin role to test GPS endpoints
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=user_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_result("User Registration", True, "Test user registered successfully")
                return True
            elif response.status_code == 400 and "already registered" in response.text:
                # Try to login instead
                return self.login_test_user()
            else:
                self.log_result("User Registration", False, f"Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def login_test_user(self):
        """Login with test user"""
        try:
            login_data = {
                "email": "gps.tester@posrider.com",
                "password": "TestPass123!"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log_result("User Login", True, "Test user logged in successfully")
                return True
            else:
                self.log_result("User Login", False, f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_gps_all_endpoint(self):
        """Test GET /api/gps/all endpoint - main fix target"""
        try:
            # Test the problematic endpoint that was causing 500 errors
            response = self.session.get(f"{self.base_url}/api/gps/all", timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_result("GPS All Endpoint", True, f"Returned array with {len(data)} items", data)
                        return True
                    else:
                        self.log_result("GPS All Endpoint", False, f"Expected array, got {type(data)}", data)
                        return False
                except json.JSONDecodeError:
                    self.log_result("GPS All Endpoint", False, "Invalid JSON response", response.text)
                    return False
            elif response.status_code == 404:
                self.log_result("GPS All Endpoint", False, "Endpoint not found - route may not exist", response.text)
                return False
            elif response.status_code == 500:
                self.log_result("GPS All Endpoint", False, "500 Internal Server Error - route order fix failed", response.text)
                return False
            else:
                self.log_result("GPS All Endpoint", False, f"Unexpected status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GPS All Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_gps_locations_endpoint(self):
        """Test GET /api/gps/locations endpoint (alternative GPS endpoint)"""
        try:
            response = self.session.get(f"{self.base_url}/api/gps/locations", timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        self.log_result("GPS Locations Endpoint", True, f"Returned array with {len(data)} items", data)
                        return True
                    else:
                        self.log_result("GPS Locations Endpoint", False, f"Expected array, got {type(data)}", data)
                        return False
                except json.JSONDecodeError:
                    self.log_result("GPS Locations Endpoint", False, "Invalid JSON response", response.text)
                    return False
            elif response.status_code == 401:
                self.log_result("GPS Locations Endpoint", False, "Authentication required", response.text)
                return False
            elif response.status_code == 403:
                self.log_result("GPS Locations Endpoint", False, "Admin access required", response.text)
                return False
            else:
                self.log_result("GPS Locations Endpoint", False, f"Status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GPS Locations Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_gps_post_endpoint(self):
        """Test POST /api/gps endpoint for location updates"""
        try:
            gps_data = {
                "latitude": -6.2088,  # Jakarta coordinates
                "longitude": 106.8456
            }
            
            response = self.session.post(f"{self.base_url}/api/gps", json=gps_data, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_result("GPS POST Endpoint", True, "Location update successful", data)
                    return True
                except json.JSONDecodeError:
                    self.log_result("GPS POST Endpoint", True, "Location update successful (non-JSON response)", response.text)
                    return True
            elif response.status_code == 404:
                self.log_result("GPS POST Endpoint", False, "Endpoint not found", response.text)
                return False
            elif response.status_code == 401:
                self.log_result("GPS POST Endpoint", False, "Authentication required", response.text)
                return False
            else:
                self.log_result("GPS POST Endpoint", False, f"Status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GPS POST Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_gps_update_endpoint(self):
        """Test POST /api/gps/update endpoint (alternative GPS update)"""
        try:
            gps_data = {
                "latitude": -6.2088,  # Jakarta coordinates
                "longitude": 106.8456
            }
            
            response = self.session.post(f"{self.base_url}/api/gps/update", json=gps_data, timeout=10)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log_result("GPS Update Endpoint", True, "Location update successful", data)
                    return True
                except json.JSONDecodeError:
                    self.log_result("GPS Update Endpoint", True, "Location update successful (non-JSON response)", response.text)
                    return True
            elif response.status_code == 401:
                self.log_result("GPS Update Endpoint", False, "Authentication required", response.text)
                return False
            else:
                self.log_result("GPS Update Endpoint", False, f"Status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("GPS Update Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_wildcard_route_behavior(self):
        """Test that wildcard routes don't interfere with specific routes"""
        try:
            # Test a specific rider ID that might trigger wildcard behavior
            test_rider_id = "test-rider-123"
            response = self.session.get(f"{self.base_url}/api/gps/{test_rider_id}", timeout=10)
            
            # We expect this to either work (200) or return 404 (not found), but NOT 500
            if response.status_code in [200, 404]:
                self.log_result("Wildcard Route Test", True, f"Wildcard route handled correctly: {response.status_code}")
                return True
            elif response.status_code == 500:
                self.log_result("Wildcard Route Test", False, "500 error suggests route order issue", response.text)
                return False
            else:
                self.log_result("Wildcard Route Test", True, f"Unexpected but non-500 status: {response.status_code}")
                return True
                
        except Exception as e:
            self.log_result("Wildcard Route Test", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all GPS-related tests"""
        print("=" * 60)
        print("GPS API ENDPOINT TESTING")
        print("=" * 60)
        print(f"Backend URL: {self.base_url}")
        print()
        
        # Test basic connectivity
        if not self.test_health_check():
            print("❌ Cannot connect to backend - aborting tests")
            return False
        
        # Setup authentication
        auth_success = self.register_test_user()
        
        # Run GPS tests
        print("\n--- GPS Endpoint Tests ---")
        gps_all_result = self.test_gps_all_endpoint()
        gps_locations_result = self.test_gps_locations_endpoint()
        
        if auth_success:
            gps_post_result = self.test_gps_post_endpoint()
            gps_update_result = self.test_gps_update_endpoint()
            wildcard_result = self.test_wildcard_route_behavior()
        else:
            print("⚠️  Skipping authenticated tests due to auth failure")
            gps_post_result = False
            gps_update_result = False
            wildcard_result = False
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        
        # Critical GPS tests
        critical_gps_working = gps_all_result or gps_locations_result
        gps_update_working = gps_post_result or gps_update_result
        
        print(f"\n🎯 Critical Results:")
        print(f"   GPS Data Retrieval: {'✅ Working' if critical_gps_working else '❌ Failed'}")
        print(f"   GPS Location Update: {'✅ Working' if gps_update_working else '❌ Failed'}")
        print(f"   Route Order Fix: {'✅ Working' if not any('500' in r['message'] for r in self.test_results) else '❌ Still has 500 errors'}")
        
        return critical_gps_working and (not auth_success or gps_update_working)

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()