import React, { useState, useEffect } from "react";
import api from "../../services/authService";

const CustomerManagement = ({ businessId, inviteCode, colors }) => {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleApproval = async (id, approved) => {
    try {
      await api.patch(`/auth/approve-customer/${id}/`, { approved });
    } catch (err) {
      console.error("Error approving customer", err);
    }
  };

  const handleRejection = async (id) => {
    try {
      await api.patch(`/auth/approve-customer/${id}/`, { approved: false, rejected: true });
    } catch (err) {
      console.error("Error rejecting customer", err);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/management/manufacturer/business-customers/?business=${businessId}`);
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchCustomers();
    }
  }, [businessId]);

  const pendingCustomers = customers.filter(customer => !customer.is_approved && !customer.rejected);
  const approvedCustomers = customers.filter(customer => customer.is_approved);
  const rejectedCustomers = customers.filter(customer => customer.rejected);

  return (
    <div style={{
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      color: colors.textDark,
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        {/* Title */}
        <h1 style={{
          fontSize: "1.75rem",
          fontWeight: "700",
          marginBottom: "8px",
          color: colors.textDark
        }}>
          Customer Management
        </h1>
        
        {/* Invite Code Card */}
        {inviteCode && (
          <div style={{
            backgroundColor: colors.backgroundAlt,
            borderRadius: "12px",
            padding: "16px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border || "rgba(0,0,0,0.05)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}>
            <div>
              <div style={{
                color: colors.textLight,
                fontSize: "0.85rem",
                fontWeight: "500",
                marginBottom: "6px"
              }}>
                Business Invite Code
              </div>
              <div style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: colors.textLight,
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                paddingLeft: "4px"
              }}>
                {inviteCode}
              </div>
            </div>
            <button 
              onClick={handleCopy}
              style={{
                backgroundColor: copied ? colors.success : colors.primary,
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                minWidth: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        overflow: "hidden"
      }}>
        {/* Section Header with Tabs */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${colors.border || "rgba(0,0,0,0.05)"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ 
            fontSize: "1.2rem", 
            fontWeight: "600",
            margin: 0
          }}>
            Customers
          </h2>
          
          <div style={{
            fontSize: "0.9rem",
            color: colors.textLight
          }}>
            Total: {customers.length}
          </div>
        </div>
        
        {/* Customers List Content */}
        <div style={{ padding: "8px" }}>
          {isLoading ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: colors.textLight
            }}>
              Loading customers...
            </div>
          ) : pendingCustomers.length > 0 || approvedCustomers.length > 0 || rejectedCustomers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* Table Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px, 1fr) minmax(200px, 1.2fr) minmax(120px, 0.8fr) auto",
                padding: "12px 16px",
                fontWeight: "500",
                color: colors.textDark,
                fontSize: "0.85rem",
                borderBottom: `1px solid ${colors.border || "rgba(0,0,0,0.05)"}`
              }}>
                <div>NAME</div>
                <div>EMAIL</div>
                <div>STATUS</div>
                <div></div>
              </div>
              
              {/* Customers List */}
              {customers.map((customer) => (
                <div key={customer.id} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 1fr) minmax(200px, 1.2fr) minmax(120px, 0.8fr) auto",
                  padding: "16px",
                  alignItems: "center",
                  borderBottom: `1px solid ${colors.border || "rgba(0,0,0,0.05)"}`,
                  backgroundColor: customer.is_approved ? "transparent" : colors.backgroundColor,
                  transition: "all 0.15s ease",
                  ":hover": {
                    backgroundColor: colors.backgroundHover || "rgba(0,0,0,0.01)"
                  }
                }}>
                  {/* Name */}
                  <div style={{ fontWeight: "500", color: colors.textDark }}>
                    {customer.username || customer.name || customer.first_name || customer.last_name || customer.email || "Unnamed Customer"}
                  </div>
                  
                  {/* Email */}
                  <div style={{ color: colors.textDark }}>
                    {customer.email}
                  </div>
                  
                  {/* Status */}
                  <div>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      backgroundColor: customer.is_approved 
                        ? colors.backgroundAlt
                        : customer.rejected
                          ? colors.error + "15"
                          : colors.warning + "15",
                      color: customer.is_approved 
                        ? "#ffffff" 
                        : customer.rejected
                          ? colors.error
                          : colors.warning,
                    }}>
                      <span style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: customer.is_approved 
                          ? colors.success 
                          : customer.rejected
                            ? colors.error
                            : colors.warning,
                        display: "inline-block"
                      }}></span>
                      {customer.is_approved ? "Approved" : customer.rejected ? "Rejected" : "Pending"}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end"
                  }}>
                    {customer.rejected ? (
                      <button
                        onClick={() => handleApproval(customer.id, true)}
                        style={{
                          backgroundColor: "transparent",
                          color: colors.success,
                          border: `1px solid ${colors.success}`,
                          borderRadius: "8px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.85rem",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Approve
                      </button>
                    ) : customer.is_approved ? (
                      <button
                        onClick={() => handleApproval(customer.id, false)}
                        style={{
                          backgroundColor: "transparent",
                          color: colors.textDark,
                          border: `1px solid ${colors.border || "rgba(0,0,0,0.1)"}`,
                          borderRadius: "8px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.85rem",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApproval(customer.id, true)}
                          style={{
                            backgroundColor: "transparent",
                            color: colors.success,
                            border: `1px solid ${colors.success}`,
                            borderRadius: "8px",
                            padding: "6px 14px",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejection(customer.id)}
                          style={{
                            backgroundColor: "transparent",
                            color: colors.error,
                            border: `1px solid ${colors.error}`,
                            borderRadius: "8px",
                            padding: "6px 14px",
                            cursor: "pointer",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              color: colors.textLight,
              backgroundColor: colors.backgroundAlt,
              margin: "16px",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "1.1rem", marginBottom: "8px" }}>No customers found</p>
                <p style={{ fontSize: "0.9rem" }}>Share your invite code to get started</p>
              </div>
              {inviteCode && (
                <button
                  onClick={handleCopy}
                  style={{
                    backgroundColor: colors.primary,
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V8M10 20H18C19.1046 20 20 19.1046 20 18V10C20 8.89543 19.1046 8 18 8H10C8.89543 8 8 8.89543 8 10V18C8 19.1046 8.89543 20 10 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Copy Invite Code
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;